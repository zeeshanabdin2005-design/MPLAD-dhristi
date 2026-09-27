const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

const importToAdd = `import { SupabaseImage } from '../components/SupabaseImage';
import { getSignedUrl } from '../services/supabaseStorageService';\n`;

code = code.replace(`import { auth } from '../lib/firebase';`, `import { auth } from '../lib/firebase';\n${importToAdd}`);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
