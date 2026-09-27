const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSetup = `const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);`;

const newSetup = `const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fake-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'fake-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);`;

code = code.replace(oldSetup, newSetup);
fs.writeFileSync('server.ts', code);
