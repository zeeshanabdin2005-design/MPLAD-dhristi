const fs = require('fs');

// Patch VerificationQueue.tsx
let vq = fs.readFileSync('src/pages/VerificationQueue.tsx', 'utf8');
if (!vq.includes('ArrowRight')) {
    vq = vq.replace("XCircle", "XCircle, ArrowRight");
    fs.writeFileSync('src/pages/VerificationQueue.tsx', vq);
}

// Patch index.ts types
let types = fs.readFileSync('src/types/index.ts', 'utf8');

// Add to ProjectImage
types = types.replace(
  /export interface ProjectImage \{/,
  "export interface ProjectImage {\n  evidenceSignals?: string[];\n  visibleText?: string[];\n  observations?: string[];\n  sceneDescription?: string;"
);

// Add to HistoricalObservation
types = types.replace(
  /export interface HistoricalObservation \{/,
  "export interface HistoricalObservation {\n  anomalyDetected?: boolean;\n  featureSnapshot?: Record<string, any>;\n  modelVersion?: string;"
);

// Add to MpladsProject
types = types.replace(
  /export interface MpladsProject \{/,
  "export interface MpladsProject {\n  projectType?: string;"
);

fs.writeFileSync('src/types/index.ts', types);

