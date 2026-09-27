const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const oldSetup = `export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');`;
const newSetup = `export const supabase = createClient(supabaseUrl || 'https://fake-supabase-url.supabase.co', supabaseAnonKey || 'fake-anon-key');`;

code = code.replace(oldSetup, newSetup);
fs.writeFileSync('src/lib/supabase.ts', code);
