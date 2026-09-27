const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'ai-studio-applet-webapp-e9f89' });

async function createBucket() {
  try {
    const bucketName = 'ai-studio-applet-webapp-e9f89.firebasestorage.app';
    console.log(`Creating bucket ${bucketName}...`);
    const [bucket] = await storage.createBucket(bucketName, {
      location: 'ASIA-SOUTHEAST1',
    });
    console.log(`Bucket ${bucket.name} created.`);
  } catch (error) {
    console.error('Failed to create bucket:', error.message);
  }
}

createBucket();
