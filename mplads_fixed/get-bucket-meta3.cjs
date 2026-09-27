const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'ai-studio-applet-webapp-e9f89' });

async function getMeta() {
  try {
    const bucket = storage.bucket('ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180');
    const [metadata] = await bucket.getMetadata();
    console.log('Metadata:', metadata.name);
  } catch (error) {
    console.error('Failed to get metadata:', error.message);
  }
}

getMeta();
