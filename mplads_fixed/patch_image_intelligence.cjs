const fs = require('fs');
let code = fs.readFileSync('src/pages/ImageIntelligence.tsx', 'utf8');

const importToAdd = `import { SupabaseImage } from '../components/SupabaseImage';`;
code = code.replace(`import { uploadImage, getProjectImages } from '../services/evidenceService';`, `import { uploadImage, getProjectImages } from '../services/evidenceService';\n${importToAdd}`);

code = code.replace(`<img src={img.metadata?.downloadURL} alt={img.fileName} className="w-full h-24 object-cover" referrerPolicy="no-referrer" />`, `<SupabaseImage storagePath={img.storagePath} fallbackUrl={img.metadata?.downloadURL} alt={img.fileName} className="w-full h-24 object-cover" referrerPolicy="no-referrer" />`);

code = code.replace(`<img src={displayImages[0].metadata?.downloadURL} alt="Analysis" className="w-full rounded-lg border border-slate-200" referrerPolicy="no-referrer" />`, `<SupabaseImage storagePath={displayImages[0].storagePath} fallbackUrl={displayImages[0].metadata?.downloadURL} alt="Analysis" className="w-full rounded-lg border border-slate-200" referrerPolicy="no-referrer" />`);

fs.writeFileSync('src/pages/ImageIntelligence.tsx', code);
