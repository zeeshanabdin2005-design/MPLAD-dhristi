const fs = require('fs');
let code = fs.readFileSync('src/services/projectService.ts', 'utf8');

code = code.replace(
  "const q = query(collection(db, 'projects'), limit(100));",
  "const q = query(collection(db, 'projects'), limit(5000)); // Increased limit to allow risk engine to process the dataset"
);

fs.writeFileSync('src/services/projectService.ts', code);
