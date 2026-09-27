const fs = require('fs');
let code = fs.readFileSync('src/pages/DocumentIntelligence.tsx', 'utf8');

// Add an error state
if (!code.includes('const [errorMsg, setErrorMsg] = useState')) {
  code = code.replace('const [uploading, setUploading] = useState(false);', 'const [uploading, setUploading] = useState(false);\n  const [errorMsg, setErrorMsg] = useState<string | null>(null);\n  const [successMsg, setSuccessMsg] = useState<string | null>(null);');
}

// Replace alert
code = code.replace(/alert\("Unsupported file type.*?\.txt\."\);/g, 'setErrorMsg("Unsupported file type. Please upload PDF, JPG, PNG, CSV, or TXT.");');
code = code.replace(/alert\("Document uploaded successfully\."\);/g, 'setSuccessMsg("Document uploaded successfully."); setTimeout(() => setSuccessMsg(null), 3000);');
code = code.replace(/alert\(\`Upload failed: \$\{err\.message \|\| 'Permission denied or network error'\}\`\);/g, 'setErrorMsg(`Upload failed: ${err.message || \'Permission denied or network error\'}`);');

// Add error UI near the upload button
const uploadSectionStr = `<div className="flex gap-4">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.csv,.txt"
                className="hidden"
                id="doc-upload"
                onChange={handleFileUpload}
                disabled={!selectedProjectId || uploading}
              />`;

const errorUIStr = `<div className="flex flex-col gap-2">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-200 flex items-center justify-between">
                  <span>{errorMsg}</span>
                  <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
              {successMsg && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium border border-green-200">
                  {successMsg}
                </div>
              )}
              <div className="flex gap-4">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.csv,.txt"
                className="hidden"
                id="doc-upload"
                onChange={handleFileUpload}
                disabled={!selectedProjectId || uploading}
              />`;

if (!code.includes('{errorMsg && (')) {
  code = code.replace(uploadSectionStr, errorUIStr);
}

// Add XCircle import if not exists
if (!code.includes('XCircle')) {
  code = code.replace('AlertTriangle, ArrowRight } from \'lucide-react\';', 'AlertTriangle, ArrowRight, XCircle } from \'lucide-react\';');
}

fs.writeFileSync('src/pages/DocumentIntelligence.tsx', code);
