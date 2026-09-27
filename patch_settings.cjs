const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
code = code.replace("const { user } = useAuth();", "const { user, profile } = useAuth();");

const oldUserBlock = `
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                   <span className="text-2xl font-bold text-blue-700">{user?.email ? user.email.charAt(0).toUpperCase() : 'Z'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{user?.email || 'Zeeshan Abdin'}</h3>
                  <p className="text-sm text-slate-500">District Officer, Bhopal</p>
`;

const newUserBlock = `
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                   <span className="text-2xl font-bold text-blue-700">{profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'O')}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{profile?.fullName || user?.email || 'Officer'}</h3>
                  <p className="text-sm text-slate-500">{profile?.designation || 'District Officer'}, {profile?.location || 'Bhopal'}</p>
`;

code = code.replace(oldUserBlock.trim(), newUserBlock.trim());
fs.writeFileSync('src/pages/Settings.tsx', code);
