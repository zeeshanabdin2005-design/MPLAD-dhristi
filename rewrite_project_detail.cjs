const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById } from '../services/projectService';
import { getRiskAssessment } from '../services/riskService';
import { getProjectDocuments, getProjectImages, getAuditLogs } from '../services/evidenceService';
import { getVerificationCase, createVerificationCase, updateCaseStatus } from '../services/verificationService';
import { MpladsProject, RiskAssessment, ProjectDocument, ProjectImage, AuditLog, VerificationCase } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ArrowLeft, FileText, Image as ImageIcon, Map, 
  AlertTriangle, ShieldAlert, CheckCircle, Clock, FileWarning, CheckCircle2, Loader2, Database,
  Plus, History, User, Activity, MapPin, Search
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<MpladsProject | null>(null);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [vCase, setVCase] = useState<VerificationCase | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateCase = async () => {
    if (!id || !assessment) return;
    try {
      setSubmittingAction(true);
      await createVerificationCase(id, assessment);
      await fetchData();
    } catch (err: any) {
      alert("Failed to create case: " + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateStatus = async (status: VerificationCase['status'], decision?: string) => {
    if (!vCase || !id) return;
    try {
      setSubmittingAction(true);
      await updateCaseStatus(vCase.id, id, status, notes, decision);
      await fetchData();
    } catch (err: any) {
      alert("Failed to update case: " + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#0F2A43] animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading comprehensive intelligence file...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="font-bold">{error || "Project not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/projects')}>Back to Directory</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-sm font-medium text-slate-500 hover:text-[#0F2A43] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="flex items-center gap-2">
          {vCase?.status === 'VERIFIED' && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase tracking-wider text-[10px] font-bold"><ShieldAlert className="w-3 h-3 mr-1 inline"/> VERIFIED</Badge>
          )}
          {vCase?.status === 'DISMISSED' && (
            <Badge className="bg-slate-100 text-slate-800 border-slate-200 uppercase tracking-wider text-[10px] font-bold">DISMISSED</Badge>
          )}
          {vCase?.status === 'UNDER_REVIEW' && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 uppercase tracking-wider text-[10px] font-bold">UNDER REVIEW</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Project Information & Verification Workflow */}
        <div className="md:col-span-1 space-y-6">
           <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
             <div className="bg-[#0F2A43] p-6 text-white">
               <h1 className="text-xl font-bold mb-1">{project.id}</h1>
               <p className="text-[#0F2A43] text-sm bg-blue-100/10 px-2 py-0.5 inline-block rounded font-medium">{project.district}, {project.state}</p>
             </div>
             <CardContent className="p-0">
               <div className="divide-y divide-slate-100">
                 <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sanctioned</p>
                     <p className="font-mono font-medium text-slate-800">{formatCurrency(project.sanctionedFunds)}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenditure</p>
                     <p className="font-mono font-medium text-slate-800">{formatCurrency(project.actualExpenditure)}</p>
                   </div>
                 </div>
                 <div className="p-4 bg-white">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Implementing Agency</p>
                   <p className="text-sm text-slate-700">{project.implementingAgency || 'N/A'}</p>
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card className={cn("border shadow-sm", assessment?.level === 'HIGH' || assessment?.level === 'CRITICAL' ? 'border-red-200 bg-red-50/30' : assessment?.level === 'MEDIUM' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white')}>
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Risk Assessment</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Statistical anomaly detection</p>
                  </div>
                  <div className={\`relative flex items-center justify-center h-14 w-14 rounded-full border-4 \${assessment?.level === 'HIGH' || assessment?.level === 'CRITICAL' ? 'border-red-200' : assessment?.level === 'MEDIUM' ? 'border-amber-200' : 'border-slate-200'} bg-white shadow-sm\`}>
                    <span className={\`font-bold text-xl \${assessment?.level === 'HIGH' || assessment?.level === 'CRITICAL' ? 'text-red-600' : assessment?.level === 'MEDIUM' ? 'text-amber-600' : 'text-slate-600'}\`}>{assessment?.score || 0}</span>
                  </div>
                </div>
                   
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Detected Signals</h4>
                    {assessment && (
                      <span className="text-[10px] text-slate-400">
                        v{assessment.engineVersion} • Conf: {assessment.confidence}
                      </span>
                    )}
                  </div>
                  
                  {(!assessment || !assessment.signals || assessment.signals.length === 0) ? (
                    <div className="text-sm text-slate-500 py-2">No anomaly signals detected.</div>
                  ) : (
                    assessment.signals.map((sig, i) => (
                      <div key={i} className="flex gap-3 bg-white p-2.5 rounded border border-slate-100 shadow-sm">
                        <AlertTriangle className={\`h-4 w-4 mt-0.5 shrink-0 \${assessment?.level === 'HIGH' || assessment?.level === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}\`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-none mb-1">
                            {sig.title} 
                            <span className={\`ml-1 \${assessment?.level === 'HIGH' || assessment?.level === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}\`}>+{sig.contribution}</span>
                          </p>
                          <p className="text-xs text-slate-500 leading-snug">{sig.description}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase">Source: {sig.sourceField}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </CardContent>
           </Card>

           {/* Verification Workflow */}
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-slate-50 border-b border-slate-100">
               <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                 <ShieldAlert className="h-4 w-4 text-blue-500" /> Human Verification
               </CardTitle>
             </CardHeader>
             <CardContent className="p-4 flex flex-col gap-3">
               {!vCase ? (
                 <div className="text-center py-4">
                   <p className="text-sm text-slate-500 mb-3">No active verification case.</p>
                   <Button onClick={handleCreateCase} disabled={submittingAction || !assessment} className="w-full bg-[#0F2A43] hover:bg-[#1E3A5F]">
                     {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Verification Case'}
                   </Button>
                 </div>
               ) : (
                 <>
                   <div>
                     <label className="text-xs font-semibold text-slate-700 uppercase mb-1 block">Officer Notes</label>
                     <textarea 
                       className="w-full border border-slate-200 rounded p-2 text-sm min-h-[100px]"
                       placeholder="Enter investigation notes..."
                       value={notes}
                       onChange={e => setNotes(e.target.value)}
                     />
                   </div>
                   
                   {vCase.status !== 'VERIFIED' && vCase.status !== 'DISMISSED' && (
                     <div className="flex gap-2">
                       <Button 
                         variant="outline" 
                         className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                         onClick={() => handleUpdateStatus('VERIFIED', 'Verified by Officer')}
                         disabled={submittingAction}
                       >
                         <CheckCircle className="h-4 w-4 mr-1" /> Verify
                       </Button>
                       <Button 
                         variant="outline" 
                         className="flex-1 bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                         onClick={() => handleUpdateStatus('DISMISSED', 'False Positive / Dismissed')}
                         disabled={submittingAction}
                       >
                         Dismiss
                       </Button>
                     </div>
                   )}
                   {vCase.status !== 'UNDER_REVIEW' && vCase.status !== 'VERIFIED' && vCase.status !== 'DISMISSED' && (
                      <Button 
                        variant="outline" 
                        className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                        disabled={submittingAction}
                      >
                        <Search className="h-4 w-4 mr-1" /> Mark Under Review
                      </Button>
                   )}
                 </>
               )}
             </CardContent>
           </Card>
           
           {/* Audit Log */}
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-slate-50 border-b border-slate-100">
               <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                 <History className="h-4 w-4 text-slate-500" /> Audit Trail
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0 max-h-[300px] overflow-auto">
                <div className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No activity recorded.</div>
                  ) : (
                    auditLogs.map(log => (
                      <div key={log.id} className="p-3 bg-white hover:bg-slate-50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-700">{log.action.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <User className="h-3 w-3" /> {log.actor}
                        </p>
                      </div>
                    ))
                  )}
                </div>
             </CardContent>
           </Card>
        </div>

        {/* RIGHT COLUMN: Evidence & Telemetry */}
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-xl font-bold text-[#0F2A43] flex items-center gap-2 border-b border-slate-200 pb-2">
             <Database className="h-5 w-5 text-amber-500" /> Core Evidence
           </h2>
           
           {/* Document Evidence */}
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-3">
               <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                 <FileText className="h-4 w-4 text-amber-500" /> Uploaded Documents
               </CardTitle>
               <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/document-intelligence')}>
                 Manage <ArrowRight className="h-3 w-3 ml-1" />
               </Button>
             </CardHeader>
             <CardContent className="p-4">
                {documents.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">No documents linked to this project.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <div className="bg-amber-50 p-2 rounded shrink-0">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate" title={doc.fileName}>{doc.fileName}</p>
                          <p className="text-[10px] text-slate-500">OCR Status: {doc.processingStatus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>

           {/* Image Evidence */}
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-3">
               <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                 <ImageIcon className="h-4 w-4 text-indigo-500" /> Site Photographs
               </CardTitle>
               <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/image-intelligence')}>
                 Manage <ArrowRight className="h-3 w-3 ml-1" />
               </Button>
             </CardHeader>
             <CardContent className="p-4">
                {images.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">No site images available.</p>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-auto pb-2">
                    {images.map(img => (
                      <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden shrink-0 w-32 relative group">
                        <img src={img.metadata?.downloadURL} alt="Site" className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          <p className="text-[9px] text-white truncate" title={img.fileName}>{img.fileName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>

           {/* GIS Evidence */}
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-3">
               <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
                 <MapPin className="h-4 w-4 text-emerald-500" /> Geospatial Location
               </CardTitle>
               <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/gis-intelligence')}>
                 Open Map <ArrowRight className="h-3 w-3 ml-1" />
               </Button>
             </CardHeader>
             <CardContent className="p-4">
                {(!project.lat || !project.lng) ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center">
                    <MapPin className="h-6 w-6 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">Location data unavailable for this project.</p>
                  </div>
                ) : (
                  <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                     {/* Placeholder for map - a real map component would go here */}
                     <div className="absolute inset-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.1 }}></div>
                     <div className="flex flex-col items-center z-10 bg-white/80 p-3 rounded-lg shadow-sm border border-slate-200">
                       <MapPin className="h-5 w-5 text-emerald-600 mb-1" />
                       <span className="text-xs font-mono font-bold text-slate-700">{project.lat}, {project.lng}</span>
                     </div>
                  </div>
                )}
             </CardContent>
           </Card>
           
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
