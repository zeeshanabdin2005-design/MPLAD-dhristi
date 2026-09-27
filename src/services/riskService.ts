import { commitBatchWithRetry } from '../lib/batch-utils';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { MpladsProject, RiskAssessment } from '../types';
import { HistoricalObservation } from '../types/ml_types';
import { calculateRisk } from '../lib/risk-engine';

export async function getRiskAssessment(projectId: string): Promise<RiskAssessment | null> {
  const docRef = doc(db, 'riskAssessments', projectId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as RiskAssessment;
  }
  return null;
}

export async function getAllRiskAssessments(): Promise<RiskAssessment[]> {
  const snapshot = await getDocs(collection(db, 'riskAssessments'));
  return snapshot.docs.map(doc => doc.data() as RiskAssessment);
}

export async function calculateAndPersistRisk(project: MpladsProject, allProjectsContext: MpladsProject[] = []): Promise<RiskAssessment> {
  const existing = await getRiskAssessment(project.id);
  // Optionally, check version or force recalculation, but to avoid unnecessary writes:
  if (existing && existing.engineVersion === '3.0.0') {
    return existing;
  }
  
  const assessment = calculateRisk(project, allProjectsContext);
  await setDoc(doc(db, 'riskAssessments', assessment.projectId), assessment);
  return assessment;
}

export async function batchCalculateAndPersistRisk(projects: MpladsProject[]): Promise<RiskAssessment[]> {
  const assessments: RiskAssessment[] = [];
  let batch = writeBatch(db);
  let batchCount = 0;

  for (const project of projects) {
    const assessment = calculateRisk(project, projects);
    assessments.push(assessment);
    
    batch.set(doc(db, 'riskAssessments', assessment.projectId), assessment);
    batchCount++;
    
    if (batchCount === 400) {
      await commitBatchWithRetry(batch);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  
  if (batchCount > 0) {
    await commitBatchWithRetry(batch);
  }
  
  return assessments;
}





export const getany = async (observationId: string): Promise<any | null> => {
  try {
    const docRef = doc(db, 'mlAnomalyAssessments', observationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as any;
    }
    return null;
  } catch (error) {
    console.error("Error fetching ML assessment:", error);
    return null;
  }
};

