const fs = require('fs');

let code = fs.readFileSync('src/services/riskService.ts', 'utf8');

if (!code.includes('MlAnomalyAssessment } from')) {
  code = code.replace(
    "import { MpladsProject, RiskAssessment } from '../types';",
    "import { MpladsProject, RiskAssessment, MlAnomalyAssessment } from '../types';"
  );
  fs.writeFileSync('src/services/riskService.ts', code);
}
