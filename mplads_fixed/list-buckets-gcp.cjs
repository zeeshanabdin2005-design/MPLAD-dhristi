const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'ai-studio-applet-webapp-e9f89' });

async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(bucket.name);
    });
  } catch (error) {
    console.error('Failed to list buckets:', error.message);
  }
}

listBuckets();
