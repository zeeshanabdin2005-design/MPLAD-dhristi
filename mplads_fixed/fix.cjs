const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace(
  "import { getProjectById } from '../services/projectService';",
  "import { getProjectById } from '../services/projectService';\nimport { getRiskAssessment } from '../services/riskService';\nimport { RiskAssessment } from '../types';"
);

code = code.replace(
  "const [project, setProject] = useState<MpladsProject | null>(null);",
  "const [project, setProject] = useState<MpladsProject | null>(null);\n  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);"
);

code = code.replace(
  "let data = await getProjectById(id);\n        \n        if (data) {\n          setProject(data);",
  `const [data, riskData] = await Promise.all([
          getProjectById(id),
          getRiskAssessment(id)
        ]);
        
        if (data) {
          setProject(data);
          setAssessment(riskData);`
);

code = code.replace(
  "project.riskLevel === 'HIGH' || project.riskLevel === 'CRITICAL'",
  "assessment?.level === 'HIGH' || assessment?.level === 'CRITICAL'"
);

code = code.replace(
  "project.riskScore",
  "assessment?.score || 0"
);

code = code.replace(
  "project.signals.map",
  "(assessment?.signals || []).map"
);

code = code.replace(
  "project.signals.length",
  "(assessment?.signals || []).length"
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
