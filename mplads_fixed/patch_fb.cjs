const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const target = "export const db = initializeFirestore(app, {\n  experimentalForceLongPolling: true,\n}, firebaseConfig.firestoreDatabaseId);";
const replacement = "export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);";

code = code.replace(target, replacement);
fs.writeFileSync('src/lib/firebase.ts', code);
