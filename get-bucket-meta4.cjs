const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: 'ai-studio-applet-webapp-e9f89' });

async function getMeta() {
  const bucketsToTest = [
    'ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180.appspot.com',
    'ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180.firebasestorage.app',
    'ai-studio-mpladsdrishti'
  ];
  
  for (const b of bucketsToTest) {
    try {
      const bucket = storage.bucket(b);
      const [metadata] = await bucket.getMetadata();
      console.log('Exists:', metadata.name);
    } catch (error) {
      console.error(b, 'Failed:', error.message);
    }
  }
}

getMeta();
