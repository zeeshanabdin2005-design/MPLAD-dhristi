const fs = require('fs');
let code = fs.readFileSync('src/pages/ImageIntelligence.tsx', 'utf8');

// Clear error on new upload attempt
code = code.replace('setUploading(true);\n    setUploadProgress(0);\n    try {', 'setUploading(true);\n    setUploadProgress(0);\n    setErrorMsg(null);\n    try {');

fs.writeFileSync('src/pages/ImageIntelligence.tsx', code);
