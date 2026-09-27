const { initializeApp, getApps } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

if (getApps().length === 0) {
  initializeApp({ projectId: 'ai-studio-applet-webapp-e9f89' });
}

async function listBuckets() {
  try {
    const [buckets] = await getStorage().getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(bucket.name);
    });
  } catch (error) {
    console.error('Failed to list buckets:', error.message);
  }
}

listBuckets();
