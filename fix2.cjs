const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace(
  '<h3 className="font-bold text-slate-800 text-lg">AI Risk Score</h3>',
  '<h3 className="font-bold text-slate-800 text-lg">Risk Score</h3>'
);

code = code.replace(
  '<p className="text-xs text-slate-500 font-medium mt-1">Multi-vector analysis</p>',
  '<p className="text-xs text-slate-500 font-medium mt-1">Statistical anomaly detection</p>'
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
