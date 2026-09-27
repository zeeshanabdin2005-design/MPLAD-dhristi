const fs = require('fs');
let code = fs.readFileSync('src/services/riskService.ts', 'utf8');

const additions = `
import { auth } from '../lib/firebase';
import { MlAnomalyAssessment } from '../types';

export const getMlAnomalyAssessment = async (observationId: string): Promise<MlAnomalyAssessment | null> => {
  try {
    const docRef = doc(db, 'mlAnomalyAssessments', observationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as MlAnomalyAssessment;
    }
    return null;
  } catch (error) {
    console.error("Error fetching ML assessment:", error);
    return null;
  }
};

export const runMlInference = async (
  observationId: string, 
  constituency: string, 
  year: number, 
  features: Record<string, number>
): Promise<MlAnomalyAssessment> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Unauthenticated");

  const response = await fetch('/api/run-ml-inference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({ observationId, constituency, year, features })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'ML analysis unavailable');
  }

  return response.json();
};
`;

if (!code.includes('getMlAnomalyAssessment')) {
  // Ensure we add these without syntax errors
  if (!code.includes('import { auth }')) {
    code = code.replace("import { db } from '../lib/firebase';", "import { db, auth } from '../lib/firebase';");
  }
  // add the new types import
  code = code.replace("RiskAssessment, RiskSignal } from '../types';", "RiskAssessment, RiskSignal, MlAnomalyAssessment } from '../types';");
  code += '\n' + additions.replace("import { auth } from '../lib/firebase';", "").replace("import { MlAnomalyAssessment } from '../types';", "");
  fs.writeFileSync('src/services/riskService.ts', code);
}
