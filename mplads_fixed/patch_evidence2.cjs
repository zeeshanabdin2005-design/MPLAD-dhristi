const fs = require('fs');
let code = fs.readFileSync('src/services/evidenceService.ts', 'utf8');

// find uploadImage and replace it
const uploadImageStart = code.indexOf('export const uploadImage = async');
const getProjectImagesStart = code.indexOf('export const getProjectImages = async');

if (uploadImageStart !== -1 && getProjectImagesStart !== -1) {
  const newUploadImage = `export const uploadImage = async (
  file: File, 
  projectId: string, 
  onProgress?: (progress: number) => void
): Promise<ProjectImage> => {
  if (!auth.currentUser) throw new Error("Unauthenticated");
  
  const imageId = \`IMG_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
  const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  const storagePath = \`projects/\${projectId}/images/\${imageId}_\${safeName}\`;
  
  try {
    await uploadFileToSupabase(file, storagePath, onProgress);
    
    const imgData: ProjectImage = {
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
        bucket: 'mplads-evidence',
        downloadURL: '' 
      }
    };
    
    await setDoc(doc(db, 'images', imageId), imgData);
    
    auth.currentUser.getIdToken().then(async token => {
      try {
        await updateDoc(doc(db, 'images', imageId), { processingStatus: 'PROCESSING' });
        
        const res = await fetch('/api/process-image', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ 
            imageId, 
            projectId,
            storagePath,
            fileType: file.type
          })
        });
        
        if (!res.ok) throw new Error("AI processing failed");
        const updatePayload = await res.json();
        
        const event = new CustomEvent('imageProcessed', { detail: { imageId, updatePayload } });
        window.dispatchEvent(event);
        await logAudit(projectId, 'AI_ANALYSIS_COMPLETED', { imageId }, 'DRISHTI_AI');
      } catch (e: any) {
        console.error("AI trigger failed:", e);
        const event = new CustomEvent('imageProcessed', { detail: { imageId, updatePayload: { processingStatus: 'FAILED' } } });
        window.dispatchEvent(event);
        await logAudit(projectId, 'AI_ANALYSIS_FAILED', { imageId, error: e.message }, 'DRISHTI_AI');
      }
    }).catch(e => console.error("Token fetch failed:", e));

    return imgData;
  } catch (err: any) {
    throw new Error(\`Failed to upload image: \${err.message}\`);
  }
};

`;
  
  code = code.substring(0, uploadImageStart) + newUploadImage + code.substring(getProjectImagesStart);
  fs.writeFileSync('src/services/evidenceService.ts', code);
}
