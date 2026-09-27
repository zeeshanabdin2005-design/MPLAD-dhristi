const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace(
  '<h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Detected Signals</h4>',
  `<div className="flex justify-between items-center">
    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Detected Signals</h4>
    {assessment && (
      <span className="text-[10px] text-slate-400">
        v{assessment.engineVersion} • Conf: {assessment.confidence}
      </span>
    )}
  </div>`
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
