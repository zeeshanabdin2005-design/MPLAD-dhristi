const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The best way to securely fetch without full admin SDK initialization is to use the REST API just like we did for process-document.

const oldBlock = `
  app.post("/api/investigation-summary", authenticate, async (req, res): Promise<any> => {
    const { projectId, projData, riskData, mlData, documents, images, verificationCase } = req.body;
    const user = (req as any).user;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    
    try {
      const prompt = \`
You are DRISHTI AI
`;

const replaceTarget = `  app.post("/api/investigation-summary", authenticate, async (req, res): Promise<any> => {
    const { projectId, projData, riskData, mlData, documents, images, verificationCase } = req.body;
    const user = (req as any).user;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    
    try {
`;

const secureBlock = `  app.post("/api/investigation-summary", authenticate, async (req, res): Promise<any> => {
    const { projectId } = req.body;
    const user = (req as any).user;
    const authHeader = req.headers.authorization;
    if (!ai) return res.status(503).json({ status: 'AI_NOT_CONFIGURED', error: 'Missing GEMINI_API_KEY' });
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });
    
    try {
      // Securely fetch all authoritative data using the user's token via REST API
      const baseUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/databases/(default)/documents';
      const headers = { Authorization: authHeader || '' };
      
      const parseFirestoreDoc = (doc) => {
        if (!doc || !doc.fields) return null;
        const result = {};
        for (const [key, value] of Object.entries(doc.fields)) {
          if (value.stringValue !== undefined) result[key] = value.stringValue;
          else if (value.integerValue !== undefined) result[key] = Number(value.integerValue);
          else if (value.doubleValue !== undefined) result[key] = Number(value.doubleValue);
          else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
          else if (value.arrayValue !== undefined) {
             result[key] = value.arrayValue.values ? value.arrayValue.values.map(v => v.stringValue || v.integerValue) : [];
          }
          // We can add more robust parsing if needed, but this covers the basics
        }
        return result;
      };

      const [projRes, riskRes] = await Promise.all([
        fetch(\`\${baseUrl}/projects/\${projectId}\`, { headers }),
        fetch(\`\${baseUrl}/riskAssessments/\${projectId}\`, { headers })
      ]);

      if (!projRes.ok) return res.status(403).json({ error: 'Unauthorized or missing project' });
      
      const projData = parseFirestoreDoc(await projRes.json());
      const riskData = riskRes.ok ? parseFirestoreDoc(await riskRes.json()) : null;
      
      // For arrays (documents, images, etc.), the simplest approach is to trust the client's payload 
      // ONLY IF we strictly validate that every item belongs to projectId.
      // A more robust way is to query Firestore, but REST querying is complex.
      // We will validate the client payload items against projectId.
      
      const safeDocuments = (req.body.documents || []).filter(d => d.projectId === projectId);
      const safeImages = (req.body.images || []).filter(i => i.projectId === projectId);
      const safeMlData = (req.body.mlData && req.body.mlData.constituency === projData?.constituency && req.body.mlData.year === projData?.financialYear) ? req.body.mlData : null;
      const safeVerificationCase = (req.body.verificationCase && req.body.verificationCase.projectId === projectId) ? req.body.verificationCase : null;
`;

code = code.replace(replaceTarget, secureBlock);

// Also need to update prompt variables to use the safe versions
code = code.replace('JSON.stringify(mlData', 'JSON.stringify(safeMlData');
code = code.replace('JSON.stringify(documents', 'JSON.stringify(safeDocuments');
code = code.replace('JSON.stringify(images', 'JSON.stringify(safeImages');
code = code.replace('JSON.stringify(verificationCase', 'JSON.stringify(safeVerificationCase');

fs.writeFileSync('server.ts', code);
