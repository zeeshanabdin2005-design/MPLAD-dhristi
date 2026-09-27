import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

export const BUCKET_NAME = 'mplads-evidence';

type EvidenceKind = 'documents' | 'images' | 'contractor-updates';

const getIdToken = async (): Promise<string> => {
  if (!auth.currentUser) throw new Error('Unauthenticated');
  return auth.currentUser.getIdToken();
};

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = await getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
};

export const uploadFileToSupabase = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
  kind?: EvidenceKind,
  evidenceId?: string,
  projectId?: string
): Promise<{ path: string; url: string }> => {
  if (!supabase) {
    throw new Error('Supabase browser configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
  if (!kind || !evidenceId || !projectId) {
    throw new Error('Missing evidence upload metadata.');
  }

  onProgress?.(5);

  const signed = await apiRequest('/api/evidence/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      kind,
      evidenceId,
      projectId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      requestedPath: path,
    }),
  });

  onProgress?.(15);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  onProgress?.(100);

  return { path: data?.path || signed.path, url: '' };
};

export const deleteFileFromSupabase = async (path: string): Promise<void> => {
  try {
    await apiRequest('/api/evidence/delete', {
      method: 'POST',
      body: JSON.stringify({ storagePath: path }),
    });
  } catch (error) {
    console.error('Failed to delete file from Supabase:', error);
  }
};

export const getSignedUrl = async (path: string): Promise<string> => {
  try {
    const payload = await apiRequest('/api/evidence/url', {
      method: 'POST',
      body: JSON.stringify({ storagePath: path }),
    });
    return payload.url || '';
  } catch (error) {
    console.error('Failed to create evidence URL:', error);
    return '';
  }
};
