const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

// Add import
const importToAdd = `import { SupabaseImage } from '../components/SupabaseImage';
import { getSignedUrl } from '../services/supabaseStorageService';`;
code = code.replace(`import { getProjectDocuments, getProjectImages } from '../services/evidenceService';`, `import { getProjectDocuments, getProjectImages } from '../services/evidenceService';\n${importToAdd}`);

// Replace onClick
code = code.replace(`onClick={() => window.open(doc.metadata?.downloadURL, '_blank')}`, `onClick={async () => {
                             if (doc.storagePath) {
                               const url = await getSignedUrl(doc.storagePath);
                               window.open(url, '_blank');
                             } else if (doc.metadata?.downloadURL) {
                               window.open(doc.metadata.downloadURL, '_blank');
                             }
                           }}`);

// Replace img
code = code.replace(`<img src={img.metadata?.downloadURL} alt="Site" className="w-full h-full object-cover min-h-[200px]" referrerPolicy="no-referrer" />`, `<SupabaseImage storagePath={img.storagePath} fallbackUrl={img.metadata?.downloadURL} alt="Site" className="w-full h-full object-cover min-h-[200px]" referrerPolicy="no-referrer" />`);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
