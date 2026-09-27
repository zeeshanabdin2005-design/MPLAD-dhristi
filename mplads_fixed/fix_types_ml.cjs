const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

const mlInterface = `
export interface MlAnomalyAssessment {
  observationId: string;
  constituency: string;
  year: number;
  anomalyPrediction: number;
  anomalyScore: number;
  anomalyDetected: boolean;
  mlRiskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  modelVersion: string;
  featureVersion: string;
  featureSnapshot: Record<string, number>;
  evidence: string[];
  source: 'ISOLATION_FOREST';
  calculatedAt: string;
}
`;

if (!code.includes('MlAnomalyAssessment')) {
  code = code + '\n' + mlInterface;
  fs.writeFileSync('src/types/index.ts', code);
}
