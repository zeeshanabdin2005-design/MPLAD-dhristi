const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

// Ensure auth is imported
if (!code.includes('import { auth }')) {
  code = code.replace("import { db } from '../lib/firebase';", "import { db, auth } from '../lib/firebase';");
}

code = code.replace(
  `const res = await fetch('/api/explain-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id })
      });`,
  `const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/explain-risk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ projectId: id })
      });`
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
