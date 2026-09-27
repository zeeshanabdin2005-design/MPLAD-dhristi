const fs = require('fs');
let code = fs.readFileSync('src/pages/DocumentIntelligence.tsx', 'utf8');

// Clear error on new upload attempt
code = code.replace('setUploading(true);\n      setUploadProgress(0);\n      \n      await uploadDocument', 'setUploading(true);\n      setUploadProgress(0);\n      setErrorMsg(null);\n      setSuccessMsg(null);\n      \n      await uploadDocument');

fs.writeFileSync('src/pages/DocumentIntelligence.tsx', code);
