const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importSupabase = `import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';`;

code = code.replace(`import { GoogleGenAI } from '@google/genai';`, importSupabase);

const setupSupabase = `const auth = getAuth();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
`;

code = code.replace(`const auth = getAuth();`, setupSupabase);

fs.writeFileSync('server.ts', code);
