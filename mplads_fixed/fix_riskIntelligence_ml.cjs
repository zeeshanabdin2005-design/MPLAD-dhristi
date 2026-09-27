const fs = require('fs');

let code = fs.readFileSync('src/pages/RiskIntelligence.tsx', 'utf8');

if (!code.includes('import { MlAnomalyAssessment }')) {
  code = code.replace(
    "import { MpladsProject, RiskAssessment } from '../types';",
    "import { MpladsProject, RiskAssessment, MlAnomalyAssessment } from '../types';"
  );
  code = code.replace(
    "import { getProjects } from '../services/projectService';",
    "import { getProjects } from '../services/projectService';\nimport { collection, getDocs } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
  );
}

if (!code.includes('const [mlAssessments, setMlAssessments] = useState<Record<string, MlAnomalyAssessment>>({});')) {
  code = code.replace(
    "const [error, setError] = useState<string | null>(null);",
    "const [error, setError] = useState<string | null>(null);\n  const [mlAssessments, setMlAssessments] = useState<Record<string, MlAnomalyAssessment>>({});"
  );
}

if (!code.includes('const mlSnap = await getDocs(collection(db, \'mlAnomalyAssessments\'));')) {
  const dataFetch = `
        const mlSnap = await getDocs(collection(db, 'mlAnomalyAssessments'));
        const mlMap: Record<string, MlAnomalyAssessment> = {};
        mlSnap.forEach(doc => {
          mlMap[doc.id] = doc.data() as MlAnomalyAssessment;
        });
        setMlAssessments(mlMap);
  `;
  code = code.replace(
    "setAssessments(assessmentMap);",
    "setAssessments(assessmentMap);\n" + dataFetch
  );
}

// Modify the risk card UI to show ML Signal
const uiReplacement = `
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(\`/projects/\${project.id}\`)}>
                      {project.name || project.id}
                    </CardTitle>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={assessment.level === 'CRITICAL' || assessment.level === 'HIGH' ? 'destructive' : 'secondary'}>
                        RULE: {assessment.score} - {assessment.level}
                      </Badge>
                      {mlAssessments[project.id] && (
                        <Badge variant={mlAssessments[project.id].anomalyDetected ? 'destructive' : 'outline'} className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          ML: {mlAssessments[project.id].anomalyDetected ? mlAssessments[project.id].mlRiskCategory : 'NORMAL'}
                        </Badge>
                      )}
                    </div>
                  </div>
`;

if (!code.includes('ML: {mlAssessments[project.id]')) {
  // Try to find the exact badge rendering string
  const toReplace = `
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(\`/projects/\${project.id}\`)}>
                      {project.name || project.id}
                    </CardTitle>
                    <Badge variant={assessment.level === 'CRITICAL' || assessment.level === 'HIGH' ? 'destructive' : 'secondary'}>
                      {assessment.score} - {assessment.level}
                    </Badge>
                  </div>
`;
  if (code.includes(toReplace.trim())) {
     code = code.replace(toReplace.trim(), uiReplacement.trim());
  } else {
     // fallback regex replacement
     code = code.replace(
       /<Badge variant=\{assessment\.level === 'CRITICAL' \|\| assessment\.level === 'HIGH' \? 'destructive' : 'secondary'\}>\s*\{assessment\.score\} - \{assessment\.level\}\s*<\/Badge>/g,
       `<div className="flex flex-col gap-2 items-end">
                      <Badge variant={assessment.level === 'CRITICAL' || assessment.level === 'HIGH' ? 'destructive' : 'secondary'}>
                        RULE: {assessment.score} - {assessment.level}
                      </Badge>
                      {mlAssessments[project.id] && (
                        <Badge variant={mlAssessments[project.id].anomalyDetected ? 'destructive' : 'outline'} className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          ML: {mlAssessments[project.id].anomalyDetected ? mlAssessments[project.id].mlRiskCategory : 'NORMAL'}
                        </Badge>
                      )}
                    </div>`
     );
  }
  fs.writeFileSync('src/pages/RiskIntelligence.tsx', code);
}
