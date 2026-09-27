import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { VerificationCase, RiskAssessment } from '../types';
import { logAudit } from './evidenceService';

export const createVerificationCase = async (
  projectId: string, 
  riskAssessment: RiskAssessment
): Promise<VerificationCase> => {
  if (!auth.currentUser) throw new Error("Unauthenticated");
  
  // Check if case already exists
  const existingQ = query(collection(db, 'verificationCases'), where('projectId', '==', projectId));
  const existingSnapshot = await getDocs(existingQ);
  if (!existingSnapshot.empty) {
    return existingSnapshot.docs[0].data() as VerificationCase;
  }
  
  const caseId = `CASE_${projectId}`;
  
  const vCase: VerificationCase = {
    id: caseId,
    projectId,
    riskAssessmentId: riskAssessment.projectId, // Typically same
    status: 'PENDING',
    priority: riskAssessment.level,
    assignedTo: auth.currentUser.email || auth.currentUser.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    signals: riskAssessment.signals,
    evidenceIds: [],
    officerNotes: '',
  };
  
  await setDoc(doc(db, 'verificationCases', caseId), vCase);
  await logAudit(projectId, 'CASE_CREATED', { priority: vCase.priority }, caseId);
  
  return vCase;
};

export const getVerificationCase = async (projectId: string): Promise<VerificationCase | null> => {
  const docRef = doc(db, 'verificationCases', `CASE_${projectId}`);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as VerificationCase;
  }
  
  // Fallback query just in case ID strategy changes
  const q = query(collection(db, 'verificationCases'), where('projectId', '==', projectId));
  const qSnap = await getDocs(q);
  if (!qSnap.empty) {
    return qSnap.docs[0].data() as VerificationCase;
  }
  
  return null;
};

export const getAllVerificationCases = async (): Promise<VerificationCase[]> => {
  const snapshot = await getDocs(collection(db, 'verificationCases'));
  const cases = snapshot.docs.map(d => d.data() as VerificationCase);
  return cases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const updateCaseStatus = async (
  caseId: string, 
  projectId: string,
  status: VerificationCase['status'], 
  notes: string,
  decision?: string,
  decisionReason?: string
): Promise<void> => {
  if (!auth.currentUser) throw new Error("Unauthenticated");
  
  const updateData: Partial<VerificationCase> = {
    status,
    officerNotes: notes,
    updatedAt: new Date().toISOString()
  };
  
  if (decision) updateData.decision = decision;
  if (decisionReason) updateData.decisionReason = decisionReason;
  
  await updateDoc(doc(db, 'verificationCases', caseId), updateData);
  await logAudit(projectId, 'STATUS_CHANGED', { status, decision }, caseId);
};

