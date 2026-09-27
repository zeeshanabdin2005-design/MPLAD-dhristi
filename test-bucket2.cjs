const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'ai-studio-applet-webapp-e9f89' });

async function testBucket() {
  try {
    const bucket = storage.bucket('ai-studio-applet-webapp-e9f89.appspot.com');
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);
    if (exists) {
       await bucket.setCorsConfiguration([
        {
          origin: ['*'],
          method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-firebase-storage-version', 'x-firebase-gmpid'],
          maxAgeSeconds: 3600,
        },
      ]);
      console.log('Successfully set CORS configuration.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBucket();
