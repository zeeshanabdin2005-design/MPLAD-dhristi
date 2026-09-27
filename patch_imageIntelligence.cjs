const fs = require('fs');
let code = fs.readFileSync('src/pages/ImageIntelligence.tsx', 'utf8');

// Add an error state
if (!code.includes('const [errorMsg, setErrorMsg] = useState')) {
  code = code.replace('const [uploading, setUploading] = useState(false);', 'const [uploading, setUploading] = useState(false);\n  const [errorMsg, setErrorMsg] = useState<string | null>(null);');
}

// Replace alert with setErrorMsg
code = code.replace(/alert\(\`Upload failed: \$\{err\.message \|\| 'Permission denied or network error'\}\`\);/g, 'setErrorMsg(`Upload failed: ${err.message || \'Permission denied or network error\'}`);');

// Add error UI near the upload button
const uploadSectionStr = `<div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
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
              <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={handleFileUpload}
                disabled={!selectedProjectId || uploading}
              />`;

if (!code.includes('{errorMsg && (')) {
  code = code.replace(uploadSectionStr, errorUIStr);
}

// Add XCircle import if not exists
if (!code.includes('XCircle')) {
  code = code.replace('Search, ArrowRight } from \'lucide-react\';', 'Search, ArrowRight, XCircle } from \'lucide-react\';');
}

fs.writeFileSync('src/pages/ImageIntelligence.tsx', code);
