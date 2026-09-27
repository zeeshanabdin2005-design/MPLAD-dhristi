const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const wrongUrl = 'projects/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/databases/(default)/documents';
const rightUrl = 'projects/ai-studio-applet-webapp-e9f89/databases/ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180/documents';

code = code.replace(wrongUrl, rightUrl);
code = code.replace(wrongUrl, rightUrl); // just in case there are multiple

fs.writeFileSync('server.ts', code);
