const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
initializeApp({ projectId: 'ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180' });
console.log('App initialized');
// We don't have a token to test, but we can check if it crashes on initialization
