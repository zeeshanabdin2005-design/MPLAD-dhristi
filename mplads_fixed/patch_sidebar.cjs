const fs = require('fs');

let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

code = code.replace("const { user, signOut } = useAuth();", "const { user, profile, signOut } = useAuth();");

const oldUserBlock = `
              <span className="text-xs font-semibold text-white">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'Z'}
              </span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate">{user?.email || 'Zeeshan Abdin'}</span>
              <span className="text-[10px] text-slate-400">District Officer, Bhopal</span>
            </div>
`;

const newUserBlock = `
              <span className="text-xs font-semibold text-white">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'O')}
              </span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate">{profile?.fullName || user?.email || 'Officer'}</span>
              <span className="text-[10px] text-slate-400">{profile?.designation || 'District Officer'}</span>
              <span className="text-[10px] text-slate-400">{profile?.location || 'Bhopal'}</span>
            </div>
`;

code = code.replace(oldUserBlock.trim(), newUserBlock.trim());

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
