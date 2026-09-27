import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { uploadFileToSupabase } from './supabaseStorageService';
import { ProjectDocument, ProjectImage, AuditLog } from '../types';

const BUCKET_NAME = 'mplads-evidence';

const makeId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const safeFileName = (name: string) =>
  name.replace(/[^a-z0-9.]/gi, '_').toLowerCase().slice(0, 180);

const triggerProcessing = async (
  endpoint: '/api/process-document' | '/api/process-image',
  payload: Record<string, string>,
  collectionName: 'documents' | 'images',
  evidenceId: string,
  projectId: string,
  eventName: 'documentProcessed' | 'imageProcessed',
) => {
  if (!auth.currentUser) return;

  try {
    await updateDoc(doc(db, collectionName, evidenceId), {
      processingStatus: 'PROCESSING',
    });

    const token = await auth.currentUser.getIdToken();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || `AI processing failed (${response.status})`);
    }

    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { evidenceId, ...(eventName === 'documentProcessed' ? { documentId: evidenceId } : { imageId: evidenceId }), updatePayload: result },
      }),
    );

    await logAudit(projectId, 'AI_ANALYSIS_COMPLETED', {
      ...(eventName === 'documentProcessed' ? { documentId: evidenceId } : { imageId: evidenceId }),
      model: result.model,
    }, 'DRISHTI_AI');
  } catch (error: any) {
    const message = error?.message || 'AI processing failed';
    console.error(`${endpoint} failed:`, error);

    const failedPayload = {
      processingStatus: 'FAILED',
      processingError: message,
    };

    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { evidenceId, ...(eventName === 'documentProcessed' ? { documentId: evidenceId } : { imageId: evidenceId }), updatePayload: failedPayload },
      }),
    );

    await logAudit(projectId, 'AI_ANALYSIS_FAILED', {
      ...(eventName === 'documentProcessed' ? { documentId: evidenceId } : { imageId: evidenceId }),
      error: message,
    }, 'DRISHTI_AI');
  }
};

export const uploadDocument = async (
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void,
): Promise<ProjectDocument> => {
  if (!auth.currentUser) throw new Error('Unauthenticated');

  const documentId = makeId('DOC');
  const storagePath = `projects/${projectId}/documents/${documentId}_${safeFileName(file.name)}`;

  try {
    await uploadFileToSupabase(file, storagePath, onProgress, 'documents', documentId, projectId);

    const docData: ProjectDocument & { uploadedByUid: string } = {
      id: documentId,
      projectId,
      fileName: file.name,
      fileType: file.type,
      storagePath,
      source: 'USER_UPLOAD',
      uploadedBy: auth.currentUser.email || auth.currentUser.uid,
      uploadedAt: new Date().toISOString(),
      processingStatus: 'PENDING',
      ocrStatus: 'PENDING',
      metadata: {
        storageProvider: 'supabase',
        bucket: BUCKET_NAME,
        downloadURL: '',
      },
      uploadedByUid: auth.currentUser.uid,
    };

    await setDoc(doc(db, 'documents', documentId), docData);

    void triggerProcessing(
      '/api/process-document',
      { documentId, projectId, fileType: file.type },
      'documents',
      documentId,
      projectId,
      'documentProcessed',
    );

    return docData;
  } catch (err: any) {
    throw new Error(`Failed to upload document: ${err?.message || 'Unknown error'}`);
  }
};

export const getProjectDocuments = async (projectId: string): Promise<ProjectDocument[]> => {
  const q = query(collection(db, 'documents'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data() as ProjectDocument)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const uploadImage = async (
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void,
): Promise<ProjectImage> => {
  if (!auth.currentUser) throw new Error('Unauthenticated');

  const imageId = makeId('IMG');
  const storagePath = `projects/${projectId}/images/${imageId}_${safeFileName(file.name)}`;

  try {
    await uploadFileToSupabase(file, storagePath, onProgress, 'images', imageId, projectId);

    const imgData: ProjectImage & { uploadedByUid: string } = {
      id: imageId,
      projectId,
      fileName: file.name,
      fileType: file.type,
      storagePath,
      source: 'USER_UPLOAD',
      uploadedBy: auth.currentUser.email || auth.currentUser.uid,
      uploadedAt: new Date().toISOString(),
      processingStatus: 'PENDING',
      metadata: {
        storageProvider: 'supabase',
        bucket: BUCKET_NAME,
        downloadURL: '',
      },
      uploadedByUid: auth.currentUser.uid,
    };

    await setDoc(doc(db, 'images', imageId), imgData);

    void triggerProcessing(
      '/api/process-image',
      { imageId, projectId, fileType: file.type },
      'images',
      imageId,
      projectId,
      'imageProcessed',
    );

    return imgData;
  } catch (err: any) {
    throw new Error(`Failed to upload image: ${err?.message || 'Unknown error'}`);
  }
};

export const getProjectImages = async (projectId: string): Promise<ProjectImage[]> => {
  const q = query(collection(db, 'images'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data() as ProjectImage)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const logAudit = async (
  projectId: string,
  action: string,
  metadata?: Record<string, any>,
  caseId?: string,
): Promise<void> => {
  if (!auth.currentUser) return;
  const logId = makeId('LOG');

  const log: AuditLog = {
    id: logId,
    projectId,
    ...(caseId ? { caseId } : {}),
    action,
    actor: auth.currentUser.email || auth.currentUser.uid,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  await setDoc(doc(db, 'auditLogs', logId), log);
};

export const getAuditLogs = async (projectId: string): Promise<AuditLog[]> => {
  const q = query(collection(db, 'auditLogs'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data() as AuditLog)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
