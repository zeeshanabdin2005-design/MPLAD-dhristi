const fs = require('fs');

const code = `import { db, storage, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, Timestamp, orderBy, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ProjectDocument, ProjectImage, AuditLog } from '../types';

export const uploadDocument = async (
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
              
              const projDoc = await getDocs(query(collection(db, 'projects'), where('id', '==', projectId)));
              const projData = projDoc.empty ? {} : projDoc.docs[0].data();

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
                  fileType: file.type,
                  projData
                })
              });
              
              if (!res.ok) throw new Error("AI processing failed");
              const updatePayload = await res.json();
              await updateDoc(doc(db, 'documents', documentId), updatePayload);
              await logAudit(projectId, 'AI_ANALYSIS_COMPLETED', { documentId }, 'DRISHTI_AI');
            } catch (e: any) {
              console.error("AI trigger failed:", e);
              await updateDoc(doc(db, 'documents', documentId), { processingStatus: 'FAILED', aiStatus: 'FAILED' });
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
};

export const getProjectDocuments = async (projectId: string): Promise<ProjectDocument[]> => {
  const q = query(
    collection(db, 'documents'),
    where('projectId', '==', projectId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(d => d.data() as ProjectDocument);
  return docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const uploadImage = async (
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
              await updateDoc(doc(db, 'images', imageId), updatePayload);
              await logAudit(projectId, 'AI_ANALYSIS_COMPLETED', { imageId }, 'DRISHTI_AI');
            } catch (e: any) {
              console.error("AI trigger failed:", e);
              await updateDoc(doc(db, 'images', imageId), { processingStatus: 'FAILED', aiStatus: 'FAILED' });
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
};

export const getProjectImages = async (projectId: string): Promise<ProjectImage[]> => {
  const q = query(
    collection(db, 'images'),
    where('projectId', '==', projectId)
  );
  const snapshot = await getDocs(q);
  const imgs = snapshot.docs.map(d => d.data() as ProjectImage);
  return imgs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

export const logAudit = async (
  projectId: string, 
  action: string, 
  metadata?: Record<string, any>,
  caseId?: string
): Promise<void> => {
  if (!auth.currentUser) return;
  const logId = \`LOG_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
  
  const log: AuditLog = {
    id: logId,
    projectId,
    caseId,
    action,
    actor: auth.currentUser.email || auth.currentUser.uid,
    timestamp: new Date().toISOString(),
    metadata
  };
  
  await setDoc(doc(db, 'auditLogs', logId), log);
};

export const getAuditLogs = async (projectId: string): Promise<AuditLog[]> => {
  const q = query(
    collection(db, 'auditLogs'),
    where('projectId', '==', projectId)
  );
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map(d => d.data() as AuditLog);
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
`;

fs.writeFileSync('src/services/evidenceService.ts', code);
