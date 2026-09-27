const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Ensure downloadURL is actually from our firebase storage
const docStart = code.indexOf('const { documentId, projectId, downloadURL, fileType } = req.body;');
if (docStart !== -1) {
  const replacement = `
    const { documentId, projectId, downloadURL, fileType } = req.body;
    if (!downloadURL || !downloadURL.startsWith('https://firebasestorage.googleapis.com/v0/b/ai-studio-mpladsdrishti')) {
      return res.status(400).json({ error: 'Invalid or unauthorized downloadURL' });
    }
  `;
  code = code.replace('const { documentId, projectId, downloadURL, fileType } = req.body;', replacement.trim());
}

const imgStart = code.indexOf('const { imageId, projectId, downloadURL, fileType } = req.body;');
if (imgStart !== -1) {
  const replacement = `
    const { imageId, projectId, downloadURL, fileType } = req.body;
    if (!downloadURL || !downloadURL.startsWith('https://firebasestorage.googleapis.com/v0/b/ai-studio-mpladsdrishti')) {
      return res.status(400).json({ error: 'Invalid or unauthorized downloadURL' });
    }
  `;
  code = code.replace('const { imageId, projectId, downloadURL, fileType } = req.body;', replacement.trim());
}

fs.writeFileSync('server.ts', code);
console.log('Patched URL validation');
