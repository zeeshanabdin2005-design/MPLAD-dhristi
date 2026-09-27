import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getCountFromServer } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = {
  projectId: "ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snapshot = await getCountFromServer(collection(db, 'projects'));
  console.log('Total projects in Firestore:', snapshot.data().count);
}
check().catch(console.error);
