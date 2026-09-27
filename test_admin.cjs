const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180' });
const db = getFirestore();
db.collection('test').limit(1).get().then(() => console.log('Admin SDK works!')).catch(e => console.error('Admin SDK failed:', e.message));
