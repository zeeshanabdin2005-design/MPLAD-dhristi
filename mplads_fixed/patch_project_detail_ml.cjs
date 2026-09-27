const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace("import { getRiskAssessment, runMlInference } from '../services/riskService';", "import { getRiskAssessment } from '../services/riskService';");

const runMlIndex = code.indexOf('const handleRunMl = async () => {');
if (runMlIndex !== -1) {
  // We need to just remove the button that calls this, and this function.
  // Actually, wait. Historical observations are fetched during fetchData via getObservationByConstituencyYear.
  // The 'handleRunMl' function is an explicit manual trigger for a "live" inference.
  // Let's just make it a no-op or remove it entirely.
  const endOfRunMl = code.indexOf('  const fetchData = async () => {');
  if (endOfRunMl !== -1) {
    code = code.substring(0, runMlIndex) + code.substring(endOfRunMl);
  }
}

// Remove the button
const buttonPattern = /<Button\s+size="sm"\s+onClick=\{handleRunMl\}[^>]*>[\s\S]*?<\/Button>/;
code = code.replace(buttonPattern, "");

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
