const fs = require('fs');
let code = fs.readFileSync('src/lib/mock-data.ts', 'utf8');

code = code.replace(
  "export const mockProjects: Project[] = rawProjects.map(p => analyzeProject(p, rawProjects) as Project);",
  "export const mockProjects: Project[] = rawProjects.map(p => ({ ...p, riskScore: 85, riskLevel: 'HIGH', signals: [] }) as unknown as Project);"
);

code = code.replace(
  "import { calculateRisk } from './risk-engine';",
  ""
);

fs.writeFileSync('src/lib/mock-data.ts', code);
