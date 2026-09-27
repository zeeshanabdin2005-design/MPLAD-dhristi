const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'ai-studio-applet-webapp-e9f89' });

async function getMeta() {
  try {
    const bucket = storage.bucket('ai-studio-applet-webapp-e9f89.appspot.com');
    const [metadata] = await bucket.getMetadata();
    console.log('Metadata:', metadata);
  } catch (error) {
    console.error('Failed to get metadata:', error.message);
  }
}

getMeta();
