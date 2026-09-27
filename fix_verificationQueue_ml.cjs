const fs = require('fs');

let code = fs.readFileSync('src/pages/VerificationQueue.tsx', 'utf8');

if (!code.includes('vCase.source === \'ML_ANOMALY\'')) {
  // Add badge for source
  code = code.replace(
    '<Badge variant="outline" className="ml-2">{vCase.priority}</Badge>',
    '<Badge variant="outline" className="ml-2">{vCase.priority}</Badge>\n                      {vCase.source && <Badge variant="secondary" className="ml-2">SRC: {vCase.source}</Badge>}'
  );
  
  // also add source display somewhere else if needed, but badge is fine
  fs.writeFileSync('src/pages/VerificationQueue.tsx', code);
}
