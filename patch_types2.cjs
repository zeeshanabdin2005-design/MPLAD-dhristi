const fs = require('fs');

// Patch index.ts (Fix ProjectImage)
let types = fs.readFileSync('src/types/index.ts', 'utf8');
types = types.replace(/export interface ProjectImage \{\n  evidenceSignals\?: string\[\];\n  visibleText\?: string\[\];\n  observations\?: string\[\];\n  sceneDescription\?: string;/, "export interface ProjectImage {\n  evidenceSignals?: string[];\n  visibleText?: string[];");
fs.writeFileSync('src/types/index.ts', types);

// Patch ml_types.ts (Fix HistoricalObservation)
let mlTypes = fs.readFileSync('src/types/ml_types.ts', 'utf8');
mlTypes = mlTypes.replace(/export interface HistoricalObservation \{/, "export interface HistoricalObservation {\n  anomalyDetected?: boolean;\n  featureSnapshot?: Record<string, any>;\n  modelVersion?: string;");
fs.writeFileSync('src/types/ml_types.ts', mlTypes);

// Patch VerificationQueue.tsx
let vq = fs.readFileSync('src/pages/VerificationQueue.tsx', 'utf8');
if (!vq.includes('ArrowRight')) {
  vq = vq.replace(/import \{.*?\} from 'lucide-react';/, (match) => match.replace("}", ", ArrowRight }"));
  fs.writeFileSync('src/pages/VerificationQueue.tsx', vq);
}

