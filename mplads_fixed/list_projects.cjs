const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180' });
const db = getFirestore();

db.collection('projects').limit(5).get().then(snap => {
  snap.forEach(doc => {
    console.log(doc.id, doc.data().constituency, doc.data().financialYear);
  });
}).catch(console.error);
