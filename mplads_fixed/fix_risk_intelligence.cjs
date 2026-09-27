const fs = require('fs');
let code = fs.readFileSync('src/pages/RiskIntelligence.tsx', 'utf8');

// Update to use both high and medium risk
code = code.replace(
  "const highRiskWithNames = highRisk.map(a => {",
  "const investigationQueue = [...highRisk, ...medRisk].map(a => {"
);

code = code.replace(
  "highRiskWithNames.length === 0",
  "investigationQueue.length === 0"
);

code = code.replace(
  "No high risk projects detected in current analysis.",
  "No high or medium risk projects detected in current analysis."
);

code = code.replace(
  "{highRiskWithNames.map((assessment) => (",
  "{investigationQueue.map((assessment) => ("
);

// We should also adjust the badge color logic depending on risk level
code = code.replace(
  /<div className="relative flex items-center justify-center h-8 w-8 rounded-full border-2 border-red-200 bg-red-50">/g,
  "{`relative flex items-center justify-center h-8 w-8 rounded-full border-2 ${assessment.level === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`.replace(/^/,'<div className=')} \">".replace(/">/, "") // Let's use a standard replace
);

fs.writeFileSync('src/pages/RiskIntelligence.tsx', code);
