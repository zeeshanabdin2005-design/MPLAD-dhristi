const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');
code = code.replace(
  /<span className="text-slate-800">\{sig.evidence \|\| 'N\/A'\}<\/span>/,
  '<span className="text-slate-800">{typeof sig.evidence === "object" ? JSON.stringify(sig.evidence) : (sig.evidence || "N/A")}</span>'
);
fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
