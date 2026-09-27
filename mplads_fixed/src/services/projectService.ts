import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { MpladsProject } from '../types';

export const getProjects = async (): Promise<MpladsProject[]> => {
  const q = query(collection(db, 'projects'), limit(5000)); // Increased limit to allow risk engine to process the dataset
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as MpladsProject);
};

export const getProjectById = async (id: string): Promise<MpladsProject | null> => {
  const docRef = doc(db, 'projects', id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as MpladsProject;
  }
  return null;
};
