const http = require('http');

const runTest = (name, options, postData, expectedStatus) => {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          console.log(`PASS: ${name} (Expected ${expectedStatus}, got ${res.statusCode})`);
        } else {
          console.error(`FAIL: ${name} (Expected ${expectedStatus}, got ${res.statusCode}) - Response: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`FAIL: ${name} - Request error: ${e.message}`);
      resolve();
    });
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runAll = async () => {
  // Test 1: No auth header
  await runTest('No Authorization header', {
    hostname: '0.0.0.0',
    port: 3000,
    path: '/api/process-document',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { documentId: 'test', projectId: 'test' }, 401);

  // Test 2: Invalid token
  await runTest('Invalid token', {
    hostname: '0.0.0.0',
    port: 3000,
    path: '/api/process-document',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer NOT_A_VALID_TOKEN'
    }
  }, { documentId: 'test', projectId: 'test' }, 401);
  
  // Test 3 & 4 requires a real token. But getting a real token automatically requires firebase SDK login which we can't do without a real account.
  // The backend mock verifies through Admin SDK, which requires an actual Firebase signed token. We proved the unauthenticated part correctly returns 401.
};

runAll();
