const fs = require('fs');
let code = fs.readFileSync('src/services/importService.ts', 'utf8');

code = "import { commitBatchWithRetry } from '../lib/batch-utils';\n" + code;

code = code.replace(
  "await batch.commit();",
  "await commitBatchWithRetry(batch);"
);
code = code.replace(
  "await batch.commit();",
  "await commitBatchWithRetry(batch);"
);

fs.writeFileSync('src/services/importService.ts', code);
