const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("initializeApp({ projectId: 'ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180' });", "initializeApp({ projectId: 'ai-studio-applet-webapp-e9f89' });");

const wrongUrl2 = "const baseUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/databases/(default)/documents';";
const rightUrl2 = "const baseUrl = 'https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents';";
code = code.replace(wrongUrl2, rightUrl2);

fs.writeFileSync('server.ts', code);
