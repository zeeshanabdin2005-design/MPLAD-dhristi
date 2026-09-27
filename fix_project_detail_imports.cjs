const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace(
  "import { getRiskAssessment } from '../services/riskService';",
  "import { getRiskAssessment } from '../services/riskService';\nimport { getProjectDocuments, getProjectImages, getAuditLogs } from '../services/evidenceService';\nimport { getVerificationCase, createVerificationCase, updateCaseStatus } from '../services/verificationService';"
);
code = code.replace(
  "import { MpladsProject } from '../types';",
  "import { MpladsProject, ProjectDocument, ProjectImage, AuditLog, VerificationCase } from '../types';"
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
