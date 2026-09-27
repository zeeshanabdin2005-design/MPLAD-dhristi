const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

const oldBlock = `
                 {!mlAssessment ? (
                    <Button onClick={handleRunMl} disabled={loadingMl} size="sm" variant="outline" className="w-full text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 mt-2">
                      {loadingMl ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />} Check History
                    </Button>
                 ) : (
`;

const newBlock = `
                 {!mlAssessment ? (
                    <div className="w-full text-center text-xs text-slate-500 italic mt-2 p-2 bg-slate-50 rounded border border-slate-100">
                      No historical ML data available.
                    </div>
                 ) : (
`;

code = code.replace(oldBlock.trim(), newBlock.trim());
fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
