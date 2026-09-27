const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importSupabase = `import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";`;

code = code.replace(`import { GoogleGenAI } from "@google/genai";`, importSupabase);

const setupSupabase = `
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-3.8-flash";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
`;

code = code.replace(`
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-3.8-flash";`, setupSupabase);

// Patch /api/process-document
const oldProcessDocument = `  app.post("/api/process-document", authenticate, async (req, res): Promise<any> => {
    const { documentId, projectId, downloadURL, fileType } = req.body;
    if (!downloadURL || !downloadURL.startsWith('https://firebasestorage.googleapis.com/v0/b/ai-studio-mpladsdrishti')) {
      return res.status(400).json({ error: 'Invalid or unauthorized downloadURL' });
    }
    const authHeader = req.headers.authorization;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    
    try {
      // Securely fetch authoritative project data using the user's token via REST API
      const firestoreUrl = \`https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents/projects/\${projectId}\`;
      const projRes = await fetch(firestoreUrl, { headers: { Authorization: authHeader || '' } });
      let projData = {};
      if (projRes.ok) {
        const doc = await projRes.json();
        if (doc && doc.fields) {
          for (const [key, value] of Object.entries(doc.fields)) {
            const val = value as any;
            if (val.stringValue !== undefined) projData[key] = val.stringValue;
            else if (val.integerValue !== undefined) projData[key] = Number(val.integerValue);
            else if (val.doubleValue !== undefined) projData[key] = Number(val.doubleValue);
          }
        }
      }

      let inlineData = null;
      if (downloadURL) {
        const fileRes = await fetch(downloadURL);
        if (!fileRes.ok) throw new Error("Failed to fetch document from storage");
        const arrayBuffer = await fileRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        inlineData = {
          mimeType: fileType || 'application/pdf',
          data: base64Data
        };
      }`;

const newProcessDocument = `  app.post("/api/process-document", authenticate, async (req, res): Promise<any> => {
    const { documentId, projectId, storagePath, fileType } = req.body;
    if (!storagePath) {
      return res.status(400).json({ error: 'Invalid or missing storagePath' });
    }
    const authHeader = req.headers.authorization;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    
    try {
      // Securely fetch authoritative project data using the user's token via REST API
      const firestoreUrl = \`https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents/projects/\${projectId}\`;
      const projRes = await fetch(firestoreUrl, { headers: { Authorization: authHeader || '' } });
      let projData = {};
      if (projRes.ok) {
        const doc = await projRes.json();
        if (doc && doc.fields) {
          for (const [key, value] of Object.entries(doc.fields)) {
            const val = value as any;
            if (val.stringValue !== undefined) projData[key] = val.stringValue;
            else if (val.integerValue !== undefined) projData[key] = Number(val.integerValue);
            else if (val.doubleValue !== undefined) projData[key] = Number(val.doubleValue);
          }
        }
      }

      let inlineData = null;
      if (storagePath) {
        const { data: fileData, error } = await supabase.storage.from('mplads-evidence').download(storagePath);
        if (error || !fileData) throw new Error(\`Failed to fetch document from Supabase: \${error?.message}\`);
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        inlineData = {
          mimeType: fileType || 'application/pdf',
          data: base64Data
        };
      }`;

code = code.replace(oldProcessDocument, newProcessDocument);

// Patch /api/process-image
const oldProcessImage = `  app.post("/api/process-image", authenticate, async (req, res): Promise<any> => {
    const { imageId, projectId, downloadURL, fileType } = req.body;
    if (!downloadURL || !downloadURL.startsWith('https://firebasestorage.googleapis.com/v0/b/ai-studio-mpladsdrishti')) {
      return res.status(400).json({ error: 'Invalid or unauthorized downloadURL' });
    }
    const authHeader = req.headers.authorization;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    
    try {
      // Securely fetch authoritative project data using the user's token via REST API
      const firestoreUrl = \`https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents/projects/\${projectId}\`;
      const projRes = await fetch(firestoreUrl, { headers: { Authorization: authHeader || '' } });
      let projData: any = {};
      if (projRes.ok) {
        const doc = await projRes.json();
        if (doc && doc.fields) {
          for (const [key, value] of Object.entries(doc.fields)) {
            const val = value as any;
            if (val.stringValue !== undefined) projData[key] = val.stringValue;
            else if (val.integerValue !== undefined) projData[key] = Number(val.integerValue);
            else if (val.doubleValue !== undefined) projData[key] = Number(val.doubleValue);
          }
        }
      }

      let inlineData = null;
      if (downloadURL) {
        const fileRes = await fetch(downloadURL);
        if (!fileRes.ok) throw new Error("Failed to fetch image from storage");
        const arrayBuffer = await fileRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        inlineData = {
          mimeType: fileType || 'image/jpeg',
          data: base64Data
        };
      }`;

const newProcessImage = `  app.post("/api/process-image", authenticate, async (req, res): Promise<any> => {
    const { imageId, projectId, storagePath, fileType } = req.body;
    if (!storagePath) {
      return res.status(400).json({ error: 'Invalid or missing storagePath' });
    }
    const authHeader = req.headers.authorization;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    
    try {
      // Securely fetch authoritative project data using the user's token via REST API
      const firestoreUrl = \`https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents/projects/\${projectId}\`;
      const projRes = await fetch(firestoreUrl, { headers: { Authorization: authHeader || '' } });
      let projData: any = {};
      if (projRes.ok) {
        const doc = await projRes.json();
        if (doc && doc.fields) {
          for (const [key, value] of Object.entries(doc.fields)) {
            const val = value as any;
            if (val.stringValue !== undefined) projData[key] = val.stringValue;
            else if (val.integerValue !== undefined) projData[key] = Number(val.integerValue);
            else if (val.doubleValue !== undefined) projData[key] = Number(val.doubleValue);
          }
        }
      }

      let inlineData = null;
      if (storagePath) {
        const { data: fileData, error } = await supabase.storage.from('mplads-evidence').download(storagePath);
        if (error || !fileData) throw new Error(\`Failed to fetch image from Supabase: \${error?.message}\`);
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        inlineData = {
          mimeType: fileType || 'image/jpeg',
          data: base64Data
        };
      }`;

code = code.replace(oldProcessImage, newProcessImage);

fs.writeFileSync('server.ts', code);
