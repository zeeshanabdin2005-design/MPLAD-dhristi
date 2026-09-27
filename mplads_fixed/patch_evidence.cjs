const fs = require('fs');
let code = fs.readFileSync('src/services/evidenceService.ts', 'utf8');

// Remove Firebase storage imports
code = code.replace("import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';", "import { uploadFileToSupabase } from './supabaseStorageService';");

// Replace uploadDocument
const oldUploadDocument = `export const uploadDocument = async (
  file: File, 
  projectId: string, 
  onProgress?: (progress: number) => void
): Promise<ProjectDocument> => {
  return new Promise((resolve, reject) => {
    if (!auth.currentUser) return reject(new Error("Unauthenticated"));
    
    const documentId = \`DOC_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
    const storagePath = \`projects/\${projectId}/documents/\${documentId}_\${file.name}\`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const docData: ProjectDocument = {
            id: documentId,
            projectId,
            fileName: file.name,
            fileType: file.type,
            storagePath,
            source: 'USER_UPLOAD',
            uploadedBy: auth.currentUser!.email || auth.currentUser!.uid,
            uploadedAt: new Date().toISOString(),
            processingStatus: 'PENDING',
            ocrStatus: 'PENDING',
            metadata: { downloadURL }
          };
          
          await setDoc(doc(db, 'documents', documentId), docData);
          
          // Trigger server-side AI processing
          auth.currentUser?.getIdToken().then(async token => {
            try {
              await updateDoc(doc(db, 'documents', documentId), { processingStatus: 'PROCESSING' });
              
              const res = await fetch('/api/process-document', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': \`Bearer \${token}\`
                },
                body: JSON.stringify({ 
                  documentId, 
                  projectId,
                  downloadURL,
                  fileType: file.type
                })
              });
              
              if (!res.ok) throw new Error("AI processing failed");
              const updatePayload = await res.json();
              
              const event = new CustomEvent('documentProcessed', { detail: { documentId, updatePayload } });
              window.dispatchEvent(event);
              await logAudit(projectId, 'AI_ANALYSIS_COMPLETED', { documentId }, 'DRISHTI_AI');
            } catch (e: any) {
              console.error("AI trigger failed:", e);
              const event = new CustomEvent('documentProcessed', { detail: { documentId, updatePayload: { processingStatus: 'FAILED' } } });
              window.dispatchEvent(event);
              await logAudit(projectId, 'AI_ANALYSIS_FAILED', { documentId, error: e.message }, 'DRISHTI_AI');
            }
          }).catch(e => console.error("Token fetch failed:", e));

          resolve(docData);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};`;

const newUploadDocument = `export const uploadDocument = async (
  file: File, 
  projectId: string, 
  onProgress?: (progress: number) => void
): Promise<ProjectDocument> => {
  if (!auth.currentUser) throw new Error("Unauthenticated");
  
  const documentId = \`DOC_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
  const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  const storagePath = \`projects/\${projectId}/documents/\${documentId}_\${safeName}\`;
  
  try {
    await uploadFileToSupabase(file, storagePath, onProgress);
    
    // We don't have a public download URL anymore, so we just use the storagePath
    // We can also store the bucket name in metadata just in case
    const docData: ProjectDocument = {
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
        bucket: 'mplads-evidence',
        downloadURL: '' // Erase downloadURL as it's private now
      }
    };
    
    await setDoc(doc(db, 'documents', documentId), docData);
    
    // Trigger server-side AI processing
    auth.currentUser.getIdToken().then(async token => {
      try {
        await updateDoc(doc(db, 'documents', documentId), { processingStatus: 'PROCESSING' });
        
        const res = await fetch('/api/process-document', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ 
            documentId, 
            projectId,
            storagePath, // Pass the storagePath instead of downloadURL
            fileType: file.type
          })
        });
        
        if (!res.ok) throw new Error("AI processing failed");
        const updatePayload = await res.json();
        
        const event = new CustomEvent('documentProcessed', { detail: { documentId, updatePayload } });
        window.dispatchEvent(event);
        await logAudit(projectId, 'AI_ANALYSIS_COMPLETED', { documentId }, 'DRISHTI_AI');
      } catch (e: any) {
        console.error("AI trigger failed:", e);
        const event = new CustomEvent('documentProcessed', { detail: { documentId, updatePayload: { processingStatus: 'FAILED' } } });
        window.dispatchEvent(event);
        await logAudit(projectId, 'AI_ANALYSIS_FAILED', { documentId, error: e.message }, 'DRISHTI_AI');
      }
    }).catch(e => console.error("Token fetch failed:", e));

    return docData;
  } catch (err: any) {
    throw new Error(\`Failed to upload document: \${err.message}\`);
  }
};`;

code = code.replace(oldUploadDocument, newUploadDocument);

const oldUploadImage = `export const uploadImage = async (
  file: File, 
  projectId: string, 
  onProgress?: (progress: number) => void
): Promise<ProjectImage> => {
  return new Promise((resolve, reject) => {
    if (!auth.currentUser) return reject(new Error("Unauthenticated"));
    
    const imageId = \`IMG_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
    const storagePath = \`projects/\${projectId}/images/\${imageId}_\${file.name}\`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const imgData: ProjectImage = {
            id: imageId,
            projectId,
            fileName: file.name,
            fileType: file.type,
            storagePath,
            source: 'USER_UPLOAD',
            uploadedBy: auth.currentUser!.email || auth.currentUser!.uid,
            uploadedAt: new Date().toISOString(),
            processingStatus: 'PENDING',
            metadata: { downloadURL }
          };
          
          await setDoc(doc(db, 'images', imageId), imgData);
          
          auth.currentUser?.getIdToken().then(async token => {
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
                  downloadURL,
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

          resolve(imgData);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};`;

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
};`;

code = code.replace(oldUploadImage, newUploadImage);
fs.writeFileSync('src/services/evidenceService.ts', code);
