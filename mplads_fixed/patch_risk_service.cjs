const fs = require('fs');
let code = fs.readFileSync('src/services/riskService.ts', 'utf8');

const startIndex = code.indexOf('export const runMlInference');
if (startIndex !== -1) {
  code = code.substring(0, startIndex);
  fs.writeFileSync('src/services/riskService.ts', code);
  console.log('Removed runMlInference');
}
