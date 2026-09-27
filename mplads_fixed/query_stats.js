import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ai-studio-mpladsdrishti-683c1ad9-59b7-45d7-9d88-6312ce2da180",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snapshot = await getDocs(collection(db, 'projects'));
  let count = 0;
  let gapSum = 0;
  let pendingSum = 0;
  let sanctionSum = 0;
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    count++;
    gapSum += d.completionGapPct || 0;
    pendingSum += d.pendingSharePct || 0;
    sanctionSum += d.avgSanctionPerWorkLakh || 0;
  });
  console.log(`Count: ${count}, Avg Gap: ${gapSum/count}, Avg Pending: ${pendingSum/count}, Avg Sanction: ${sanctionSum/count}`);
}
check().catch(console.error);
