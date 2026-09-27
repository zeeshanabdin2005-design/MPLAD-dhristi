const fs = require('fs');

let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

// Imports
if (!code.includes('MlAnomalyAssessment')) {
  code = code.replace(
    "import { MpladsProject, RiskAssessment, ProjectDocument, ProjectImage, AuditLog, VerificationCase } from '../types';",
    "import { MpladsProject, RiskAssessment, ProjectDocument, ProjectImage, AuditLog, VerificationCase, MlAnomalyAssessment } from '../types';"
  );
  
  code = code.replace(
    "import { getRiskAssessment } from '../services/riskService';",
    "import { getRiskAssessment, getMlAnomalyAssessment, runMlInference } from '../services/riskService';"
  );
}

if (!code.includes('const [mlAssessment, setMlAssessment] = useState<MlAnomalyAssessment | null>(null);')) {
  code = code.replace(
    "const [error, setError] = useState<string | null>(null);",
    "const [error, setError] = useState<string | null>(null);\n  const [mlAssessment, setMlAssessment] = useState<MlAnomalyAssessment | null>(null);\n  const [loadingMl, setLoadingMl] = useState(false);\n  const [mlError, setMlError] = useState<string | null>(null);"
  );
}

// In useEffect for loading data
if (!code.includes('const mlData = await getMlAnomalyAssessment(id);')) {
  code = code.replace(
    "const logsData = await getAuditLogs(id);",
    "const logsData = await getAuditLogs(id);\n        const mlData = await getMlAnomalyAssessment(id);\n        if (mlData) setMlAssessment(mlData);"
  );
}

// Add handleRunMl function
const handleRunMlFn = `
  const handleRunMl = async () => {
    if (!project || !id) return;
    try {
      setLoadingMl(true);
      setMlError(null);
      const features = {
        fundsAvailable: project.fundsAvailable || 0,
        sanctionedFunds: project.sanctionedFunds || 0,
        actualExpenditure: project.actualExpenditure || 0,
        worksSanctioned: project.worksSanctioned || 0,
        worksCompleted: project.worksCompleted || 0,
        pendingWorks: project.pendingWorks || 0,
        pctCompleted: project.pctCompleted || 0,
        pctUtilisation: project.pctUtilisation || 0,
        expenditureToSanctionedPct: project.expenditureToSanctionedPct || 0,
        pendingSharePct: project.pendingSharePct || 0,
        completionGapPct: project.completionGapPct || 0,
        avgSanctionPerWorkLakh: project.avgSanctionPerWorkLakh || 0
      };
      
      const result = await runMlInference(
        id, 
        project.constituency || 'Unknown', 
        project.financialYear || 2023,
        features
      );
      setMlAssessment(result);
    } catch (e: any) {
      setMlError(e.message || 'ML analysis unavailable');
    } finally {
      setLoadingMl(false);
    }
  };
`;
if (!code.includes('const handleRunMl = async () => {')) {
  code = code.replace('const handleExplainAI = async () => {', handleRunMlFn + '\n  const handleExplainAI = async () => {');
}

// Add UI component
const mlUI = `
        {/* ML ANOMALY INTELLIGENCE */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              ML Anomaly Intelligence
            </h2>
            {!mlAssessment && (
              <Button onClick={handleRunMl} disabled={loadingMl} variant="outline" size="sm">
                {loadingMl ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                Run ML Assessment
              </Button>
            )}
          </div>
          
          {mlError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {mlError}
            </div>
          )}

          {mlAssessment ? (
            <Card className="border-indigo-100 shadow-sm">
              <CardHeader className={cn("pb-3 rounded-t-xl", mlAssessment.anomalyDetected ? "bg-red-50" : "bg-green-50")}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {mlAssessment.anomalyDetected ? (
                        <><ShieldAlert className="h-5 w-5 text-red-600" /> ML Anomaly Detected</>
                      ) : (
                        <><CheckCircle2 className="h-5 w-5 text-green-600" /> Normal Statistical Pattern</>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Isolation Forest Analysis • {mlAssessment.modelVersion}
                    </CardDescription>
                  </div>
                  <Badge variant={mlAssessment.anomalyDetected ? "destructive" : "outline"} className="text-sm">
                    {mlAssessment.mlRiskCategory} RISK
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Model Observation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Observation Key:</span>
                      <span className="font-medium">{mlAssessment.observationId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Year / Location:</span>
                      <span className="font-medium">{mlAssessment.year} • {mlAssessment.constituency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Anomaly Score:</span>
                      <span className="font-medium text-slate-900">{mlAssessment.anomalyScore.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Inference Time:</span>
                      <span className="font-medium">{new Date(mlAssessment.calculatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">ML Evidence Features</h4>
                  {mlAssessment.evidence && mlAssessment.evidence.length > 0 ? (
                    <ul className="space-y-2">
                      {mlAssessment.evidence.map((ev, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-500 italic">No specific anomalies highlighted in features.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="py-8 text-center text-slate-500">
                <Database className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                <p>No historical ML assessment on record for this project.</p>
              </CardContent>
            </Card>
          )}
        </div>
`;

if (!code.includes('ML ANOMALY INTELLIGENCE')) {
  code = code.replace(
    "{/* DRISHTI AI ANALYSIS */}",
    mlUI + "\n\n        {/* DRISHTI AI ANALYSIS */}"
  );
  fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
}
