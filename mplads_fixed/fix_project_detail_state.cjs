const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

// find the states
const stateMatch = code.match(/const \[loading, setLoading\] = useState\(true\);\s*const \[error, setError\] = useState<string \| null>\(null\);\s*const \[isVerifying, setIsVerifying\] = useState\(false\);\s*const \[isVerified, setIsVerified\] = useState\(false\);/);

if (stateMatch) {
  const newStates = `const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [vCase, setVCase] = useState<VerificationCase | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
`;
  code = code.replace(stateMatch[0], newStates);
}

const effectMatch = code.match(/const fetchProject = async \(\) => \{[\s\S]*?fetchProject\(\);\s*\}, \[id\]\);/);
if (effectMatch) {
  const newEffect = `
  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [data, riskData, docsData, imgsData, caseData, logsData] = await Promise.all([
        getProjectById(id),
        getRiskAssessment(id),
        getProjectDocuments(id),
        getProjectImages(id),
        getVerificationCase(id),
        getAuditLogs(id)
      ]);
      
      if (data) setProject(data);
      else throw new Error("Project not found");
      
      if (riskData) setAssessment(riskData);
      setDocuments(docsData);
      setImages(imgsData);
      if (caseData) {
        setVCase(caseData);
        setNotes(caseData.officerNotes || '');
      }
      setAuditLogs(logsData);
    } catch (err: any) {
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);
`;
  code = code.replace(effectMatch[0], newEffect);
}

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
