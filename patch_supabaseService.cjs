const fs = require('fs');
let code = fs.readFileSync('src/services/supabaseStorageService.ts', 'utf8');

const checkStr = `export const uploadFileToSupabase = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string, url: string }> => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your AI Studio settings.');
  }`;

code = code.replace(`export const uploadFileToSupabase = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string, url: string }> => {`, checkStr);

fs.writeFileSync('src/services/supabaseStorageService.ts', code);
