const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = "import { getStorage } from 'firebase/storage';\n" + code;
code = code + "\nexport const storage = getStorage(app);\n";

fs.writeFileSync('src/lib/firebase.ts', code);
