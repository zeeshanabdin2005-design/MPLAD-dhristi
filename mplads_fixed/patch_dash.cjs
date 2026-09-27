const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
code = code.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport { useAuth } from '../context/AuthContext';");
code = code.replace("export function Dashboard() {\n  const navigate = useNavigate();", "export function Dashboard() {\n  const navigate = useNavigate();\n  const { profile } = useAuth();");
code = code.replace("Good Morning, Zeeshan", "Good Morning, {profile?.fullName || 'Officer'}");
fs.writeFileSync('src/pages/Dashboard.tsx', code);
