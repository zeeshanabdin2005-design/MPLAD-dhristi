const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const target = `
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
          setProfile(null);
        }
`;

const replacement = `
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          // Try to get document from cache first or server if available
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (e: any) {
          console.error("Error fetching user profile:", e.message || e);
          // If offline, we could try from cache explicitly if needed, but for now just don't crash
          setProfile(null);
        }
`;

code = code.replace(target, replacement);
fs.writeFileSync('src/context/AuthContext.tsx', code);
