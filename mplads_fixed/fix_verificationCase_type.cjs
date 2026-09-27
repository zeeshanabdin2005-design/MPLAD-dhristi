const fs = require('fs');

let code = fs.readFileSync('src/types/index.ts', 'utf8');

if (!code.includes('source?: string; // e.g. RULE_ENGINE, ML_ANOMALY')) {
  code = code.replace(
    "evidenceIds: string[];",
    "evidenceIds: string[];\n  source?: string; // e.g. RULE_ENGINE, ML_ANOMALY"
  );
  fs.writeFileSync('src/types/index.ts', code);
}
