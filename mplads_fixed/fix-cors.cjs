const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

if (getApps().length === 0) {
  initializeApp({ 
    projectId: 'ai-studio-applet-webapp-e9f89',
    storageBucket: 'ai-studio-applet-webapp-e9f89.firebasestorage.app'
  });
}

async function setCors() {
  try {
    const bucket = getStorage().bucket();
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-firebase-storage-version', 'x-firebase-gmpid'],
        maxAgeSeconds: 3600,
      },
    ]);
    console.log('Successfully set CORS configuration for the bucket.');
  } catch (error) {
    console.error('Failed to set CORS:', error.message);
  }
}

setCors();
