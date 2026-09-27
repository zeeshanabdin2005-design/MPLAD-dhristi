const fs = require('fs');

let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// 1. Add firestore imports
code = code.replace("import { auth } from '../lib/firebase';", "import { auth, db } from '../lib/firebase';\nimport { doc, setDoc } from 'firebase/firestore';");

// 2. Add new states
const stateAdds = `
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [location, setLocation] = useState('');
`;
code = code.replace("const [password, setPassword] = useState('');", "const [password, setPassword] = useState('');" + stateAdds);

// 3. Handle validation and saving
const oldSignUpBlock = `
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setMsg('Account created. Please check your email to verify your account.');
      } else {
`;

const newSignUpBlock = `
      if (isSignUp) {
        if (!fullName || !designation || !location) {
          setError('Full Name, Designation, and Location are required.');
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          fullName,
          designation,
          location,
          email,
          createdAt: new Date().toISOString()
        });
        await sendEmailVerification(cred.user);
        setMsg('Account created. Please check your email to verify your account.');
      } else {
`;

code = code.replace(oldSignUpBlock.trim(), newSignUpBlock.trim());

// 4. Add UI fields
const oldInputs = `
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Official Email / ID</label>
`;

const newInputs = `
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name" 
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Designation</label>
                  <input 
                    type="text" 
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. District Officer" 
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Bhopal, Madhya Pradesh" 
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Official Email / ID</label>
`;

code = code.replace(oldInputs.trim(), newInputs.trim());

fs.writeFileSync('src/pages/Login.tsx', code);
