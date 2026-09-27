const fs = require('fs');
let code = fs.readFileSync('src/pages/RiskIntelligence.tsx', 'utf8');

code = code.replace(
  "{`relative flex items-center justify-center h-8 w-8 rounded-full border-2 ${assessment.level === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`.replace(/^/,'<div className=')} ",
  `<div className={\`relative flex items-center justify-center h-8 w-8 rounded-full border-2 \${assessment.level === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}\`}>`
);

code = code.replace(
  '<span className="font-bold text-red-600 text-xs">{assessment.score}</span>',
  '<span className={`font-bold text-xs ${assessment.level === \'MEDIUM\' ? \'text-amber-600\' : \'text-red-600\'}`}>{assessment.score}</span>'
);

code = code.replace(
  '<AlertTriangle className="h-3 w-3 text-red-500" />',
  '<AlertTriangle className={`h-3 w-3 ${assessment.level === \'MEDIUM\' ? \'text-amber-500\' : \'text-red-500\'}`} />'
);

fs.writeFileSync('src/pages/RiskIntelligence.tsx', code);
