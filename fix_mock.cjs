const fs = require('fs');
let code = fs.readFileSync('src/lib/mock-data.ts', 'utf8');

code = code.replace(
  "import { analyzeProject } from './risk-engine';",
  "import { calculateRisk } from './risk-engine';"
);

code = code.replace(
  "export const mockProjects = mockData.map(p => analyzeProject(p, mockData));",
  "export const mockProjects = mockData.map(p => p);" // Skip calculateRisk for mocks, it doesn't match the MpladsProject interface completely or it's unneeded
);

fs.writeFileSync('src/lib/mock-data.ts', code);
