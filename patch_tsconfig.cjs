const fs = require('fs');
let code = fs.readFileSync('tsconfig.json', 'utf8');

if (code.includes('"exclude":')) {
  // assume dist is already there or add it
} else {
  // simple insert before closing brace
  code = code.replace(/}\s*$/, ',\n  "exclude": ["dist", "node_modules"]\n}');
  fs.writeFileSync('tsconfig.json', code);
}
