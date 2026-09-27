const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

if (!code.includes('import { auth } from ')) {
  code = code.replace(
    "import { formatCurrency, cn } from '../lib/utils';",
    "import { formatCurrency, cn } from '../lib/utils';\nimport { auth } from '../lib/firebase';"
  );
  fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
}
