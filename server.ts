import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { z } from "zod";

// Initialize Firebase Admin (ADC or local fallback)
if (getApps().length === 0) {
  // Using explicit project ID to match the environment
  initializeApp({ projectId: 'ai-studio-applet-webapp-e9f89' });
}

const auth = getAuth();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = 'mplads-evidence';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;


// Zod Schemas for Validation
const fieldSchema = z.object({
  value: z.union([z.string(), z.number()]).nullable(),
  confidence: z.union([z.string(), z.number()]).nullable().optional(),
  source: z.string().nullable().optional()
}).nullable().optional();

const documentSchema = z.object({
  documentType: z.string().nullable().optional(),
  extractedFields: z.object({
    sanctionedAmount: fieldSchema,
    expenditureAmount: fieldSchema,
    contractorName: fieldSchema,
    date: fieldSchema,
    location: fieldSchema,
  }).optional().nullable(),
  observations: z.array(z.string()).optional().nullable(),
  confidence: z.union([z.string(), z.number()]).nullable().optional()
});

const imageSchema = z.object({
  sceneDescription: z.string().nullable().optional(),
  visibleWorkStage: z.string().nullable().optional(),
  visibleText: z.array(z.string()).optional().nullable(),
  observations: z.array(z.string()).optional().nullable(),
  confidence: z.union([z.number(), z.string()]).nullable().optional()
});


// Helper to compare image analysis with project data
const compareImageEvidence = (extracted: any, projData: any) => {
  const signals = [];
  
  if (!projData || Object.keys(projData).length === 0) return signals;
  
  const reportedProgress = projData.physicalProgress !== undefined ? Number(projData.physicalProgress) : null;
  const workStage = extracted.visibleWorkStage?.toLowerCase() || '';
  
  // Example heuristic: If project reports high progress but image says foundation or prep
  if (reportedProgress !== null) {
    if (reportedProgress > 80 && (workStage.includes('foundation') || workStage.includes('prep') || workStage.includes('excavation') || workStage.includes('inactive'))) {
      signals.push({
        type: 'VISUAL_PROGRESS_REVIEW',
        title: 'Possible Progress Mismatch',
        description: 'Image observations should be reviewed against the recorded project progress.',
        databaseValue: `${reportedProgress}% reported`,
        extractedValue: extracted.visibleWorkStage,
        difference: 'Image suggests earlier stage'
      });
    }
  }

  return signals;
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: "1mb" }));

  // AI Setup
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  // Auth Middleware
  const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    }
    const token = authHeader.split('Bearer ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }
    try {
      const decodedToken = await auth.verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (e: any) {
      console.error("Auth validation error:", e.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  // Helper for Audit Logs
  

  // Deterministic Comparison Logic
  const compareEvidence = (extracted: any, projData: any) => {
    const signals: any[] = [];
    const fields = extracted.extractedFields || {};

    // 1. Amount Comparison
    if (fields.sanctionedAmount?.value !== undefined && fields.sanctionedAmount?.value !== null && projData.sanctionedFunds) {
      const extVal = Number(fields.sanctionedAmount.value);
      const dbVal = Number(projData.sanctionedFunds);
      if (!isNaN(extVal) && !isNaN(dbVal) && extVal !== dbVal) {
        signals.push({
          type: 'AMOUNT_MISMATCH',
          severity: 'HIGH',
          title: 'Sanctioned Amount Mismatch',
          description: `Document amount (${extVal}) does not match database amount (${dbVal}).`,
          sourceField: 'sanctionedFunds',
          confidence: 1.0,
          databaseValue: dbVal,
          extractedValue: extVal
        });
      }
    }

    if (fields.expenditureAmount?.value !== undefined && fields.expenditureAmount?.value !== null && projData.actualExpenditure) {
      const extVal = Number(fields.expenditureAmount.value);
      const dbVal = Number(projData.actualExpenditure);
      if (!isNaN(extVal) && !isNaN(dbVal) && extVal !== dbVal) {
        signals.push({
          type: 'AMOUNT_MISMATCH',
          severity: 'HIGH',
          title: 'Expenditure Amount Mismatch',
          description: `Document amount (${extVal}) does not match database amount (${dbVal}).`,
          sourceField: 'actualExpenditure',
          confidence: 1.0,
          databaseValue: dbVal,
          extractedValue: extVal
        });
      }
    }

    // 2. Contractor Comparison
    if (fields.contractorName?.value && projData.contractor && projData.contractor !== 'N/A') {
      const extCont = String(fields.contractorName.value).trim().toLowerCase();
      const dbCont = String(projData.contractor).trim().toLowerCase();
      if (extCont !== dbCont && !extCont.includes(dbCont) && !dbCont.includes(extCont)) {
        signals.push({
          type: 'CONTRACTOR_MISMATCH',
          severity: 'MEDIUM',
          title: 'Contractor Name Mismatch',
          description: `Document contractor "${fields.contractorName.value}" differs from database "${projData.contractor}".`,
          sourceField: 'contractor',
          confidence: 1.0,
          databaseValue: projData.contractor,
          extractedValue: fields.contractorName.value
        });
      }
    }

    // 3. Location Comparison
    if (fields.location?.value && projData.district) {
      const extLoc = String(fields.location.value).trim().toLowerCase();
      const dbLoc = String(projData.district).trim().toLowerCase();
      if (extLoc && dbLoc && !extLoc.includes(dbLoc) && !dbLoc.includes(extLoc)) {
         signals.push({
          type: 'LOCATION_MISMATCH',
          severity: 'MEDIUM',
          title: 'Location Mismatch',
          description: `Document location "${fields.location.value}" does not appear to match database district "${projData.district}".`,
          sourceField: 'district',
          confidence: 1.0,
          databaseValue: projData.district,
          extractedValue: fields.location.value
        });
      }
    }

    return signals;
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", ai_ready: !!ai, model: GEMINI_MODEL });
  });

  const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents';

  const parseFirestoreValue = (value: any): any => {
    if (!value) return null;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return Number(value.integerValue);
    if (value.doubleValue !== undefined) return Number(value.doubleValue);
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.timestampValue !== undefined) return value.timestampValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue !== undefined) {
      return (value.arrayValue.values || []).map(parseFirestoreValue);
    }
    if (value.mapValue !== undefined) {
      return Object.fromEntries(
        Object.entries(value.mapValue.fields || {}).map(([key, val]) => [key, parseFirestoreValue(val)])
      );
    }
    return null;
  };

  const toFirestoreValue = (value: any): any => {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    }
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(toFirestoreValue) } };
    }
    if (typeof value === 'object') {
      return {
        mapValue: {
          fields: Object.fromEntries(Object.entries(value).map(([key, val]) => [key, toFirestoreValue(val)])),
        },
      };
    }
    return { stringValue: String(value) };
  };

  const fetchFirestoreDocument = async (
    collectionName: string,
    documentId: string,
    authHeader: string,
  ): Promise<any | null> => {
    const url = `${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(documentId)}`;
    const response = await fetch(url, { headers: { Authorization: authHeader } });
    if (response.status === 404) return null;
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Firestore read failed (${response.status}): ${body.slice(0, 500)}`);
    }
    const raw = await response.json();
    return Object.fromEntries(
      Object.entries(raw.fields || {}).map(([key, value]) => [key, parseFirestoreValue(value)])
    );
  };

  const patchFirestoreDocument = async (
    collectionName: string,
    documentId: string,
    patch: Record<string, any>,
    authHeader: string,
  ): Promise<void> => {
    const url = `${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(documentId)}`;
    const fields = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, toFirestoreValue(value)]));
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Firestore update failed (${response.status}): ${body.slice(0, 500)}`);
    }
  };

  const assertProjectExists = async (projectId: string, authHeader: string) => {
    if (!projectId || !/^[A-Za-z0-9_-]+$/.test(projectId)) {
      throw new Error('Invalid projectId');
    }
    const project = await fetchFirestoreDocument('projects', projectId, authHeader);
    if (!project) throw new Error('Project not found or inaccessible');
    return project;
  };

  const assertActiveContractorAssignment = async (projectId: string, contractorUid: string, authHeader: string) => {
    const assignment = await fetchFirestoreDocument('contractorAssignments', `${projectId}_${contractorUid}`, authHeader);
    if (!assignment || assignment.contractorUid !== contractorUid || assignment.status !== 'ACTIVE') {
      throw new Error('Contractor is not assigned to this project.');
    }
    return assignment;
  };

  const assertOfficer = async (uid: string, authHeader: string) => {
    const profile = await fetchFirestoreDocument('users', uid, authHeader);
    if (!profile || (profile.role && profile.role !== 'OFFICER')) throw new Error('Officer access required.');
    return profile;
  };

  const expectedPath = (projectId: string, kind: 'documents' | 'images' | 'contractor-updates', evidenceId: string, fileName: string) =>
    `projects/${projectId}/${kind}/${evidenceId}_${fileName}`;

  const sanitizeFileName = (name: string) =>
    name.replace(/[^a-z0-9.]/gi, '_').toLowerCase().slice(0, 180);

  app.post('/api/evidence/upload-url', authenticate, async (req, res): Promise<any> => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase server storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    }

    try {
      const { kind, evidenceId, projectId, fileName, fileType, fileSize, requestedPath } = req.body || {};
      if (!['documents', 'images', 'contractor-updates'].includes(kind) || !evidenceId || !projectId || !fileName || !requestedPath) {
        return res.status(400).json({ error: 'Missing or invalid upload metadata.' });
      }

      const maxBytes = kind === 'images' || kind === 'contractor-updates' ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
      if (typeof fileSize === 'number' && fileSize > maxBytes) {
        return res.status(413).json({ error: `File exceeds the ${kind === 'images' || kind === 'contractor-updates' ? '15MB' : '10MB'} limit.` });
      }

      const authHeader = req.headers.authorization || '';
      await assertProjectExists(projectId, authHeader);
      if (kind === 'contractor-updates') {
        await assertActiveContractorAssignment(projectId, (req as any).user.uid, authHeader);
      }

      if (!/^[A-Za-z0-9_-]+$/.test(evidenceId)) {
        return res.status(400).json({ error: 'Invalid evidence ID.' });
      }

      const cleanName = sanitizeFileName(fileName);
      const path = expectedPath(projectId, kind, evidenceId, cleanName);
      if (requestedPath !== path) {
        return res.status(400).json({ error: 'Invalid storage path.' });
      }

      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .createSignedUploadUrl(path, { upsert: false });

      if (error || !data?.token) {
        throw new Error(error?.message || 'Unable to create signed upload URL.');
      }

      return res.json({ path, token: data.token, fileType: fileType || 'application/octet-stream' });
    } catch (error: any) {
      console.error('Signed upload URL error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to prepare upload.' });
    }
  });

  app.post('/api/evidence/url', authenticate, async (req, res): Promise<any> => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase server storage is not configured.' });
    }

    try {
      const { storagePath } = req.body || {};
      if (typeof storagePath !== 'string' || !storagePath.startsWith('projects/')) {
        return res.status(400).json({ error: 'Invalid storage path.' });
      }

      const match = storagePath.match(/^projects\/([A-Za-z0-9_-]+)\/(documents|images|contractor-updates)\/([^/]+)$/);
      if (!match) return res.status(400).json({ error: 'Invalid evidence storage path.' });

      const projectId = match[1];
      const authHeader = req.headers.authorization || '';
      await assertProjectExists(projectId, authHeader);
      if (match[2] === 'contractor-updates') {
        await assertOfficer((req as any).user.uid, authHeader);
      }

      const { data, error} = await supabase.storage
        .from(SUPABASE_BUCKET)
        .createSignedUrl(storagePath, 3600);
      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Unable to create signed URL.');
      }

      return res.json({ url: data.signedUrl, expiresIn: 3600 });
    } catch (error: any) {
      console.error('Evidence signed URL error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to create evidence URL.' });
    }
  });

  app.post('/api/evidence/delete', authenticate, async (req, res): Promise<any> => {
    if (!supabase) return res.status(503).json({ error: 'Supabase server storage is not configured.' });

    try {
      const { storagePath } = req.body || {};
      if (typeof storagePath !== 'string') return res.status(400).json({ error: 'Invalid storage path.' });
      const match = storagePath.match(/^projects\/([A-Za-z0-9_-]+)\/(documents|images|contractor-updates)\/([^/]+)$/);
      if (!match) return res.status(400).json({ error: 'Invalid evidence storage path.' });

      const authHeader = req.headers.authorization || '';
      await assertProjectExists(match[1], authHeader);
      if (match[2] === 'contractor-updates') await assertOfficer((req as any).user.uid, authHeader);
      const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([storagePath]);
      if (error) throw new Error(error.message);
      return res.json({ status: 'DELETED' });
    } catch (error: any) {
      console.error('Evidence delete error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to delete evidence.' });
    }
  });

  app.post('/api/process-document', authenticate, async (req, res): Promise<any> => {
    const { documentId, projectId } = req.body || {};
    const authHeader = req.headers.authorization || '';
    if (!documentId || !projectId) return res.status(400).json({ error: 'Missing documentId or projectId.' });
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    if (!supabase) return res.status(503).json({ status: 'STORAGE_NOT_CONFIGURED', error: 'Missing Supabase server credentials.' });

    try {
      const [document, projData] = await Promise.all([
        fetchFirestoreDocument('documents', documentId, authHeader),
        assertProjectExists(projectId, authHeader),
      ]);

      if (!document || document.projectId !== projectId) return res.status(403).json({ error: 'Document is not accessible for this project.' });
      if (typeof document.storagePath !== 'string') return res.status(400).json({ error: 'Document storage path is missing.' });

      const expectedPrefix = `projects/${projectId}/documents/${documentId}_`;
      if (!document.storagePath.startsWith(expectedPrefix)) return res.status(403).json({ error: 'Document storage path does not match its record.' });

      const { data: fileData, error: downloadError } = await supabase.storage.from(SUPABASE_BUCKET).download(document.storagePath);
      if (downloadError || !fileData) throw new Error(`Failed to fetch document from Supabase: ${downloadError?.message || 'file not found'}`);

      const base64Data = Buffer.from(await fileData.arrayBuffer()).toString('base64');
      const inlineData = { mimeType: document.fileType || 'application/pdf', data: base64Data };
      const prompt = `Extract structured factual information from the provided document.\nTarget fields: documentType, sanctionedAmount, expenditureAmount, contractorName, date, location.\nFor fields, return { "value": <value>, "confidence": <number or string>, "source": <string> }.\nUse null for missing fields. Do NOT invent missing values.\nProvide any general observations in the observations array.\nReturn JSON exactly matching the schema.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ text: prompt }, { inlineData }],
        config: { responseMimeType: 'application/json' },
      });

      let parsedData: any;
      try { parsedData = JSON.parse(response.text || '{}'); }
      catch { throw new Error('Failed to parse AI output as JSON.'); }

      const validationResult = documentSchema.safeParse(parsedData);
      if (!validationResult.success) throw new Error(`AI output failed schema validation: ${validationResult.error.message}`);

      const validatedData = validationResult.data;
      const evidenceSignals = compareEvidence(validatedData, projData);
      const updatePayload = {
        processingStatus: 'COMPLETED',
        ocrStatus: 'COMPLETED',
        aiStatus: 'ANALYZED',
        model: GEMINI_MODEL,
        processedAt: new Date().toISOString(),
        extractedFields: validatedData.extractedFields || {},
        observations: validatedData.observations || [],
        evidenceSignals,
        processingError: null,
      };

      await patchFirestoreDocument('documents', documentId, updatePayload, authHeader);
      return res.json(updatePayload);
    } catch (error: any) {
      console.error('Document processing error:', error);
      try {
        await patchFirestoreDocument('documents', documentId, { processingStatus: 'FAILED', ocrStatus: 'FAILED', processingError: error?.message || 'Document processing failed' }, authHeader);
      } catch (persistError: any) {
        console.error('Failed to persist document failure status:', persistError?.message || persistError);
      }
      return res.status(500).json({ status: 'FAILED', error: error?.message || 'Document processing failed.' });
    }
  });

  app.post('/api/process-image', authenticate, async (req, res): Promise<any> => {
    const { imageId, projectId } = req.body || {};
    const authHeader = req.headers.authorization || '';
    if (!imageId || !projectId) return res.status(400).json({ error: 'Missing imageId or projectId.' });
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    if (!supabase) return res.status(503).json({ status: 'STORAGE_NOT_CONFIGURED', error: 'Missing Supabase server credentials.' });

    try {
      const [image, projData] = await Promise.all([
        fetchFirestoreDocument('images', imageId, authHeader),
        assertProjectExists(projectId, authHeader),
      ]);

      if (!image || image.projectId !== projectId) return res.status(403).json({ error: 'Image is not accessible for this project.' });
      if (typeof image.storagePath !== 'string') return res.status(400).json({ error: 'Image storage path is missing.' });

      const expectedPrefix = `projects/${projectId}/images/${imageId}_`;
      if (!image.storagePath.startsWith(expectedPrefix)) return res.status(403).json({ error: 'Image storage path does not match its record.' });

      const { data: fileData, error: downloadError } = await supabase.storage.from(SUPABASE_BUCKET).download(image.storagePath);
      if (downloadError || !fileData) throw new Error(`Failed to fetch image from Supabase: ${downloadError?.message || 'file not found'}`);

      const base64Data = Buffer.from(await fileData.arrayBuffer()).toString('base64');
      const inlineData = { mimeType: image.fileType || 'image/jpeg', data: base64Data };
      const prompt = `Analyze this site photograph. Extract only observable factual information: sceneDescription, visibleWorkStage, visibleText, observations, confidence. Do not infer facts that are not visible. Return JSON exactly matching the schema.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ text: prompt }, { inlineData }],
        config: { responseMimeType: 'application/json' },
      });

      let parsedData: any;
      try { parsedData = JSON.parse(response.text || '{}'); }
      catch { throw new Error('Failed to parse AI output as JSON.'); }

      const validationResult = imageSchema.safeParse(parsedData);
      if (!validationResult.success) throw new Error(`AI output failed schema validation: ${validationResult.error.message}`);

      const validatedData = validationResult.data;
      const normalizedConfidence = validatedData.confidence == null
        ? null
        : Number(validatedData.confidence);
      const updatePayload = {
        processingStatus: 'COMPLETED',
        aiStatus: 'ANALYZED',
        model: GEMINI_MODEL,
        processedAt: new Date().toISOString(),
        observations: validatedData.observations || [],
        sceneDescription: validatedData.sceneDescription || 'No description',
        visibleWorkStage: validatedData.visibleWorkStage || 'Unknown',
        visibleText: validatedData.visibleText || [],
        confidence: Number.isFinite(normalizedConfidence) ? normalizedConfidence : null,
        evidenceSignals: compareImageEvidence(validatedData, projData),
        processingError: null,
      };

      await patchFirestoreDocument('images', imageId, updatePayload, authHeader);
      return res.json(updatePayload);
    } catch (error: any) {
      console.error('Image processing error:', error);
      try {
        await patchFirestoreDocument('images', imageId, { processingStatus: 'FAILED', processingError: error?.message || 'Image processing failed' }, authHeader);
      } catch (persistError: any) {
        console.error('Failed to persist image failure status:', persistError?.message || persistError);
      }
      return res.status(500).json({ status: 'FAILED', error: error?.message || 'Image processing failed.' });
    }
  });

  app.post("/api/explain-risk", authenticate, async (req, res): Promise<any> => {
    const { projectId } = req.body;
    const authHeader = req.headers.authorization || '';
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });
    
    try {
      const projData = await assertProjectExists(projectId, authHeader);
      const riskData = await fetchFirestoreDocument('riskAssessments', projectId, authHeader);

      const prompt = `
      You are an AI assistant helping a government officer verify an MPLADS project.
      Here is the project data: ${JSON.stringify(projData)}
      Here is the deterministic risk assessment: ${JSON.stringify(riskData)}
      
      Provide a brief, plain-English explanation of why this project was flagged, 
      what the main discrepancies are, and what the officer should look for during verification.
      Keep it under 3 paragraphs. Do not mention "deterministic" or "rule-based".
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });

      return res.json({ explanation: response.text });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ status: 'FAILED', error: e.message });
    }
  });

  app.post("/api/investigation-summary", authenticate, async (req, res): Promise<any> => {
    const { projectId } = req.body;
    const authHeader = req.headers.authorization || '';
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });
    
    try {
      const projData = await assertProjectExists(projectId, authHeader);
      const riskData = await fetchFirestoreDocument('riskAssessments', projectId, authHeader);
      const vCaseData = await fetchFirestoreDocument('verificationCases', projectId, authHeader);
      
      // Fetch authentic document and image evidence from Firestore via REST structuredQuery
      const queryFirestoreCollection = async (collectionId: string) => {
        const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
        const queryBody = {
          structuredQuery: {
            from: [{ collectionId }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'projectId' },
                op: 'EQUAL',
                value: { stringValue: projectId }
              }
            }
          }
        };
        const response = await fetch(queryUrl, {
          method: 'POST',
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(queryBody)
        });
        if (!response.ok) return [];
        const results = await response.json();
        return (results || [])
          .filter((item: any) => item.document)
          .map((item: any) => Object.fromEntries(
            Object.entries(item.document.fields || {}).map(([k, v]) => [k, parseFirestoreValue(v)])
          ));
      };

      const [documents, images] = await Promise.all([
        queryFirestoreCollection('documents'),
        queryFirestoreCollection('images')
      ]);

      const safeMlData = (req.body.mlData && req.body.mlData.constituency === (projData as any)?.constituency && req.body.mlData.financialYear === (projData as any)?.financialYear) ? req.body.mlData : null;

      const prompt = `
You are DRISHTI AI, an explainable investigation-support assistant for MPLADS (Members of Parliament Local Area Development Scheme) project monitoring.

Your ONLY job is to summarize ALREADY VALIDATED intelligence signals for a human officer.
You do NOT determine fraud. You do NOT make criminal, corruption, or misconduct determinations.
You do NOT generate a new risk score or confidence probability.
You MUST distinguish between:
- FACT (e.g., sanctioned amount)
- OBSERVATION (e.g., visible work stage in an image)
- STATISTICAL ANOMALY (e.g., historical ML outlier)
- POTENTIAL DISCREPANCY (e.g., document vs. system mismatch)
- REQUIRES VERIFICATION (e.g., pending officer review)

DO NOT modify any numerical values. If a difference exists, use the pre-calculated difference or report the raw numbers exactly as provided.
Attribute sources explicitly (e.g., "RULE ENGINE", "ML MODEL", "DOCUMENT INTELLIGENCE", "IMAGE INTELLIGENCE", "GIS", "HUMAN REVIEW").
If information is missing, state that it is missing.

Here is the factual, validated evidence for Project ID: ${projectId}

=== PROJECT CONTEXT (GIS / SYSTEM FACTS) ===
${JSON.stringify(projData, null, 2)}

=== RULE-BASED RISK ENGINE ===
${JSON.stringify(riskData || { status: "No rule-based risk assessment found." }, null, 2)}

=== HISTORICAL ML ANOMALY ===
${JSON.stringify(safeMlData || { status: "No historical ML anomaly detected." }, null, 2)}

=== DOCUMENT INTELLIGENCE ===
${JSON.stringify(documents.map((d: any) => ({ file: d.fileName, signals: d.evidenceSignals, extracted: d.extractedFields })), null, 2)}

=== IMAGE INTELLIGENCE ===
${JSON.stringify(images.map((i: any) => ({ file: i.fileName, signals: i.evidenceSignals, observations: i.observations, scene: i.sceneDescription })), null, 2)}

=== VERIFICATION STATUS ===
${JSON.stringify(vCaseData || { status: "No verification case initiated." }, null, 2)}

Respond with a JSON object matching this exact schema:
{
  "summary": "string - A concise 2-3 paragraph summary of the evidence",
  "keyFindings": ["string", "string"],
  "evidenceToVerify": ["string", "string"],
  "dataLimitations": ["string", "string"],
  "recommendedVerificationSteps": ["string", "string"]
}
`;

      const schema = {
        type: "object",
        properties: {
          summary: { type: "string" },
          keyFindings: { type: "array", items: { type: "string" } },
          evidenceToVerify: { type: "array", items: { type: "string" } },
          dataLimitations: { type: "array", items: { type: "string" } },
          recommendedVerificationSteps: { type: "array", items: { type: "string" } }
        },
        required: ["summary", "keyFindings", "evidenceToVerify", "dataLimitations", "recommendedVerificationSteps"]
      };

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      
      const resultText = response.text || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(resultText);
      } catch (e) {
        throw new Error("Failed to parse AI output as JSON");
      }
      
      return res.json({ status: 'COMPLETED', data: parsedData });
    } catch (e: any) {
      console.error("AI Investigation Summary Error:", e);
      return res.status(500).json({ status: 'FAILED', error: e.message });
    }
  });

  ;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
