import { auth, db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ContractorAssignment, ContractorUpdate, MpladsProject } from '../types';

const requireUser = () => {
  if (!auth.currentUser) throw new Error('Unauthenticated');
  return auth.currentUser;
};

const assignmentId = (projectId: string, uid: string) => `${projectId}_${uid}`;

export const requestProjectAccess = async (project: MpladsProject): Promise<ContractorAssignment> => {
  const user = requireUser();
  const existingRef = doc(db, 'contractorAssignments', assignmentId(project.id, user.uid));
  const existing = await getDoc(existingRef);

  if (existing.exists()) {
    const current = existing.data() as ContractorAssignment;
    if (current.status === 'REVOKED') {
      const reopened = {
        ...current,
        status: 'REQUESTED' as const,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(existingRef, reopened);
      return reopened;
    }
    return current;
  }

  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const data: ContractorAssignment = {
    id: existingRef.id,
    projectId: project.id,
    contractorUid: user.uid,
    contractorEmail: user.email || user.uid,
    contractorName: String(profile.fullName || user.email || 'Contractor'),
    status: 'REQUESTED',
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(existingRef, data);
  return data;
};

export const getMyAssignments = async (): Promise<ContractorAssignment[]> => {
  const user = requireUser();
  const q = query(collection(db, 'contractorAssignments'), where('contractorUid', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => d.data() as ContractorAssignment)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const getAllContractorAssignments = async (): Promise<ContractorAssignment[]> => {
  requireUser();
  const snapshot = await getDocs(collection(db, 'contractorAssignments'));
  return snapshot.docs
    .map(d => d.data() as ContractorAssignment)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const setAssignmentStatus = async (
  id: string,
  status: ContractorAssignment['status'],
): Promise<void> => {
  const user = requireUser();
  await updateDoc(doc(db, 'contractorAssignments', id), {
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'ACTIVE'
      ? { approvedBy: user.email || user.uid, approvedAt: new Date().toISOString() }
      : {}),
  });
};

export const getMyAssignedProjects = async (): Promise<MpladsProject[]> => {
  const assignments = await getMyAssignments();
  const active = assignments.filter(a => a.status === 'ACTIVE');
  const projects = await Promise.all(active.map(a => getDoc(doc(db, 'projects', a.projectId))));
  return projects
    .filter(s => s.exists())
    .map(s => s.data() as MpladsProject);
};

export const getMyContractorUpdates = async (): Promise<ContractorUpdate[]> => {
  const user = requireUser();
  const q = query(collection(db, 'contractorUpdates'), where('contractorUid', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => d.data() as ContractorUpdate)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};


export const getAllContractorUpdates = async (): Promise<ContractorUpdate[]> => {
  requireUser();
  const snapshot = await getDocs(collection(db, 'contractorUpdates'));
  return snapshot.docs
    .map(d => d.data() as ContractorUpdate)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const getProjectContractorUpdates = async (projectId: string): Promise<ContractorUpdate[]> => {
  requireUser();
  const q = query(collection(db, 'contractorUpdates'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => d.data() as ContractorUpdate)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const submitContractorUpdate = async (
  payload: Omit<ContractorUpdate, 'id' | 'contractorUid' | 'contractorName' | 'contractorEmail' | 'status' | 'submittedAt'>,
): Promise<ContractorUpdate> => {
  const user = requireUser();
  const assignment = await getDoc(doc(db, 'contractorAssignments', assignmentId(payload.projectId, user.uid)));
  if (!assignment.exists() || assignment.data().status !== 'ACTIVE') {
    throw new Error('This project is not currently assigned to your contractor account.');
  }

  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const stableUpdateId = `${payload.projectId}_${user.uid}_${payload.weekEnding}`.replace(/[^A-Za-z0-9_-]/g, '_');
  const updateRef = doc(db, 'contractorUpdates', stableUpdateId);
  const existingUpdate = await getDoc(updateRef);
  if (existingUpdate.exists()) throw new Error('A weekly update for this project and week has already been submitted.');
  const update: ContractorUpdate = {
    ...payload,
    id: updateRef.id,
    contractorUid: user.uid,
    contractorName: String(profile.fullName || user.email || 'Contractor'),
    contractorEmail: user.email || user.uid,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
  };
  await setDoc(updateRef, update);
  return update;
};
