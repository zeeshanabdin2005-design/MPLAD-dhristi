const fs = require('fs');

let code = fs.readFileSync('src/data/historical_anomalies.ts', 'utf8');

// Find the index of the for loop
const loopIndex = code.indexOf('for (let i = 6; i <= 234; i++) {');
if (loopIndex !== -1) {
  code = code.substring(0, loopIndex);
  fs.writeFileSync('src/data/historical_anomalies.ts', code);
  console.log('Removed loop from historical_anomalies.ts');
}
