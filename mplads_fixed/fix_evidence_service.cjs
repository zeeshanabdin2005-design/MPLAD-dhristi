const fs = require('fs');

let code = fs.readFileSync('src/services/evidenceService.ts', 'utf8');

// We need to import auth if it's not already imported
if (!code.includes('import { auth }')) {
  code = code.replace("import { db, storage } from '../lib/firebase';", "import { db, storage, auth } from '../lib/firebase';");
}

code = code.replace(
  `fetch('/api/process-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId, projectId })
          })`,
  `auth.currentUser?.getIdToken().then(token => {
            fetch('/api/process-document', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${token}\`
              },
              body: JSON.stringify({ documentId, projectId })
            }).catch(e => console.error("AI trigger failed:", e));
          })`
);

code = code.replace(
  `fetch('/api/process-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId, projectId })
          })`,
  `auth.currentUser?.getIdToken().then(token => {
            fetch('/api/process-image', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${token}\`
              },
              body: JSON.stringify({ imageId, projectId })
            }).catch(e => console.error("AI trigger failed:", e));
          })`
);

fs.writeFileSync('src/services/evidenceService.ts', code);
