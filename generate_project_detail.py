import sys

code = """import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById } from '../services/projectService';
import { getRiskAssessment, runMlInference } from '../services/riskService';
import { getObservationByConstituencyYear } from '../services/historicalMlService';
import { HistoricalObservation } from '../types/ml_types';
import { getProjectDocuments, getProjectImages, getAuditLogs } from '../services/evidenceService';
import { getVerificationCase, createVerificationCase, updateCaseStatus } from '../services/verificationService';
import { MpladsProject, RiskAssessment, ProjectDocument, ProjectImage, AuditLog, VerificationCase} from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency, cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { 
  ArrowLeft, FileText, Image as ImageIcon, Map, 
  AlertTriangle, ShieldAlert, CheckCircle, Clock, FileWarning, CheckCircle2, Loader2, Database,
  Plus, History, User, Activity, MapPin, Search, ArrowRight, Sparkles, AlertCircle, TextSearch, LayoutDashboard,
  XCircle
} from 'lucide-react';

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
  const [mlAssessment, setMlAssessment] = useState<HistoricalObservation | null>(null);
  const [loadingMl, setLoadingMl] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  
  const handleRunMl = async () => {
    if (!project || !id) return;
    try {
      setLoadingMl(true);
      setMlError(null);
      const features = {
        fundsAvailable: project.fundsAvailable || 0,
        sanctionedFunds: project.sanctionedFunds || 0,
        actualExpenditure: project.actualExpenditure || 0,
        worksSanctioned: project.worksSanctioned || 0,
        worksCompleted: project.worksCompleted || 0,
        pendingWorks: project.pendingWorks || 0,
        pctCompleted: project.pctCompleted || 0,
        pctUtilisation: project.pctUtilisation || 0,
        expenditureToSanctionedPct: project.expenditureToSanctionedPct || 0,
        pendingSharePct: project.pendingSharePct || 0,
        completionGapPct: project.completionGapPct || 0,
        avgSanctionPerWorkLakh: project.avgSanctionPerWorkLakh || 0
      };
      
      const result = await runMlInference(
        id, 
        project.constituency || 'Unknown', 
        project.financialYear || 2023,
        features
      );
      setMlAssessment(result);
    } catch (e: any) {
      setMlError(e.message || 'ML analysis unavailable');
    } finally {
      setLoadingMl(false);
    }
  };

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
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading investigation command center...</p>
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

  const docSignalsCount = documents.reduce((acc, doc) => acc + (doc.evidenceSignals?.length || 0), 0);
  const imgSignalsCount = images.reduce((acc, img) => acc + (img.evidenceSignals?.length || 0), 0);
  const mlSignalsCount = mlAssessment?.anomalyDetected ? 1 : 0;
  const ruleSignalsCount = assessment?.signals?.length || 0;

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-sm font-medium text-slate-500 hover:text-[#0F2A43] transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F2A43] flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
            PROJECT INVESTIGATION
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {vCase?.status === 'VERIFIED' && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase tracking-wider font-bold p-1.5 px-3"><ShieldAlert className="w-4 h-4 mr-1 inline"/> VERIFIED</Badge>
          )}
          {vCase?.status === 'DISMISSED' && (
            <Badge className="bg-slate-100 text-slate-800 border-slate-200 uppercase tracking-wider font-bold p-1.5 px-3"><XCircle className="w-4 h-4 mr-1 inline" /> DISMISSED</Badge>
          )}
          {vCase?.status === 'UNDER_REVIEW' && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 uppercase tracking-wider font-bold p-1.5 px-3"><Search className="w-4 h-4 mr-1 inline" /> UNDER REVIEW</Badge>
          )}
          {(!vCase || vCase?.status === 'PENDING') && (
             <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase tracking-wider font-bold p-1.5 px-3"><AlertCircle className="w-4 h-4 mr-1 inline" /> PENDING REVIEW</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT PANEL: Identity & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Identity */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
             <div className="bg-[#0F2A43] p-5 text-white">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Identity</p>
               <h2 className="text-xl font-bold mb-1 break-words">{project.id}</h2>
               <p className="text-sm font-medium opacity-90 mb-3">{project.name}</p>
               <div className="flex flex-wrap gap-2 mt-2">
                 <Badge variant="outline" className="bg-blue-900/40 text-blue-100 border-blue-800/50 hover:bg-blue-900/60 transition-colors">{project.district}</Badge>
                 <Badge variant="outline" className="bg-blue-900/40 text-blue-100 border-blue-800/50 hover:bg-blue-900/60 transition-colors">{project.state}</Badge>
               </div>
             </div>
             <CardContent className="p-0">
               <div className="divide-y divide-slate-100">
                 <div className="p-4 bg-white">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Type</p>
                   <p className="text-sm text-slate-700">{project.projectType || 'N/A'}</p>
                 </div>
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
                 <div className="p-4 bg-white">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                   <p className="text-sm font-bold text-slate-700">{project.status}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          {/* Evidence Summary */}
          <Card className="border-slate-200 shadow-sm bg-slate-50">
            <CardHeader className="py-4 border-b border-slate-100">
              <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-700">Evidence Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
               <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
                 <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><Database className="h-4 w-4 text-slate-400"/> Rule-Based Signals</span>
                 <Badge className={ruleSignalsCount > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}>{ruleSignalsCount}</Badge>
               </div>
               <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
                 <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><Activity className="h-4 w-4 text-slate-400"/> ML Anomaly Signals</span>
                 <Badge className={mlSignalsCount > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}>{mlSignalsCount}</Badge>
               </div>
               <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
                 <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400"/> Document Signals</span>
                 <Badge className={docSignalsCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}>{docSignalsCount}</Badge>
               </div>
               <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
                 <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-slate-400"/> Image Signals</span>
                 <Badge className={imgSignalsCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}>{imgSignalsCount}</Badge>
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-200">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex justify-between">
                    <span>Verification Action</span>
                    <span>{vCase?.status || 'PENDING'}</span>
                 </p>
                 <Button className="w-full bg-[#0F2A43] hover:bg-[#1E3A5F] text-white" onClick={() => navigate('/verification-queue')}>
                   <ShieldAlert className="mr-2 h-4 w-4" /> REVIEW EVIDENCE
                 </Button>
               </div>
            </CardContent>
          </Card>
          
          {/* DRISHTI AI Placeholder */}
          <Card className="border-indigo-100 shadow-sm bg-indigo-50/50">
            <CardHeader className="py-4 border-b border-indigo-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wider font-bold text-indigo-900 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> DRISHTI AI</CardTitle>
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 text-[9px] uppercase">COMING IN NEXT PHASE</Badge>
            </CardHeader>
            <CardContent className="p-4 text-center text-sm text-indigo-700">
               <p>Explainable investigation summary coming in the next phase.</p>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE PANEL: Intelligence Streams */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RISK OVERVIEW (Side by side separation) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="border-slate-200 shadow-sm">
               <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                 <Badge variant="outline" className="mb-2 bg-slate-200 text-slate-700 border-slate-300 w-fit text-[10px] font-bold">SOURCE: RULE ENGINE</Badge>
                 <CardTitle className="text-sm font-bold text-slate-800">Rule-Based Risk</CardTitle>
               </CardHeader>
               <CardContent className="p-4 flex items-center justify-between">
                 <div>
                   <p className="text-3xl font-black text-slate-800">{assessment?.score || 0}</p>
                   <p className={"text-xs font-bold uppercase " + (assessment?.level === 'CRITICAL' || assessment?.level === 'HIGH' ? 'text-red-600' : 'text-slate-500')}>{assessment?.level || 'UNKNOWN'}</p>
                 </div>
                 {assessment?.level === 'CRITICAL' || assessment?.level === 'HIGH' ? (
                   <AlertTriangle className="h-8 w-8 text-red-500" />
                 ) : (
                   <ShieldAlert className="h-8 w-8 text-amber-500" />
                 )}
               </CardContent>
             </Card>

             <Card className="border-slate-200 shadow-sm flex flex-col">
               <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                 <Badge variant="outline" className="mb-2 bg-indigo-100 text-indigo-800 border-indigo-200 w-fit text-[10px] font-bold">SOURCE: ML MODEL</Badge>
                 <CardTitle className="text-sm font-bold text-slate-800">Historical ML Anomaly</CardTitle>
               </CardHeader>
               <CardContent className="p-4 flex-1 flex flex-col justify-center">
                 {!mlAssessment ? (
                    <Button onClick={handleRunMl} disabled={loadingMl} size="sm" variant="outline" className="w-full text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 mt-2">
                      {loadingMl ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />} Check History
                    </Button>
                 ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={"text-sm font-black " + (mlAssessment.anomalyDetected ? 'text-red-600' : 'text-emerald-600')}>
                          {mlAssessment.anomalyDetected ? 'DETECTED' : 'NOT DETECTED'}
                        </p>
                        <p className="text-xs font-bold text-slate-500 uppercase">{project.financialYear} • {project.constituency}</p>
                      </div>
                      {mlAssessment.anomalyDetected ? (
                         <AlertTriangle className="h-8 w-8 text-red-500" />
                      ) : (
                         <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      )}
                    </div>
                 )}
               </CardContent>
             </Card>
          </div>

          {/* RISK SIGNALS */}
          {assessment && assessment.signals && assessment.signals.length > 0 && (
            <Card className="border-red-200 shadow-sm bg-red-50/20">
              <CardHeader className="py-3 border-b border-red-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> RISK SIGNALS
                </CardTitle>
                <Badge variant="outline" className="bg-red-100 text-red-800 text-[9px] uppercase border-red-300 font-bold">CURRENT PROJECT DATA</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {assessment.signals.map((sig, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-red-700">{sig.title}</h4>
                      <Badge className={"font-mono " + (sig.severity === 'CRITICAL' ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800")}>+{sig.contribution}</Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{sig.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-bold text-slate-500 uppercase block mb-1">Source Field</span>
                        <span className="font-mono text-slate-800">{sig.sourceField}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-bold text-slate-500 uppercase block mb-1">Evidence</span>
                        <span className="text-slate-800">{sig.evidence || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ML ANOMALY INTELLIGENCE (Historical) */}
          {mlAssessment && mlAssessment.anomalyDetected && (
            <Card className="border-indigo-200 shadow-sm bg-indigo-50/20">
              <CardHeader className="py-3 border-b border-indigo-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-indigo-900 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> ML ANOMALY INTELLIGENCE
                </CardTitle>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 text-[9px] uppercase border-indigo-300 font-bold">MODEL OUTPUT — HISTORICAL DATA</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                 <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-indigo-900">Historical Pattern Anomaly</h4>
                      <Badge className="bg-red-100 text-red-800 font-mono">Score: {mlAssessment.anomalyScore?.toFixed(2)}</Badge>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-1">Risk Category: <span className="text-red-600">{mlAssessment.mlRiskCategory}</span></p>
                      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                        {mlAssessment.evidence?.map((ev: string, idx: number) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                       <p className="text-[10px] font-bold text-indigo-800 uppercase mb-2">Relevant Features Snippet</p>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs text-indigo-900">
                          <div>Pct Completed: {mlAssessment.featureSnapshot?.pctCompleted}%</div>
                          <div>Pct Utilisation: {mlAssessment.featureSnapshot?.pctUtilisation}%</div>
                          <div>Version: {mlAssessment.modelVersion}</div>
                       </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          )}

          {/* DOCUMENT EVIDENCE */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="py-3 border-b border-slate-100">
              <Badge variant="outline" className="mb-2 bg-amber-100 text-amber-800 border-amber-200 w-fit text-[10px] font-bold">SOURCE: DOCUMENT INTELLIGENCE</Badge>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" /> DOCUMENT EVIDENCE
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs bg-white" onClick={() => navigate('/document-intelligence')}>
                   Open Tool <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               {documents.length === 0 ? (
                 <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                   <p className="text-sm text-slate-500">No documents processed.</p>
                 </div>
               ) : (
                 documents.map(doc => (
                   <div key={doc.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                     <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-sm text-slate-700 truncate" title={doc.fileName}>{doc.fileName}</span>
                          <span className="text-[10px] ml-2 text-slate-500 uppercase">{doc.fileType}</span>
                        </div>
                        <Badge className={doc.processingStatus === 'COMPLETED' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                          {doc.processingStatus}
                        </Badge>
                     </div>
                     {doc.processingStatus === 'COMPLETED' && doc.extractedFields && (
                       <div className="p-4">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Extracted Sanctioned</span>
                              <span className="font-mono text-xs font-semibold text-slate-800">{doc.extractedFields.sanctionedAmount || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Extracted Expenditure</span>
                              <span className="font-mono text-xs font-semibold text-slate-800">{doc.extractedFields.expenditureAmount || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Contractor</span>
                              <span className="text-xs font-semibold text-slate-800 truncate block" title={doc.extractedFields.contractor || 'N/A'}>{doc.extractedFields.contractor || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-[9px] font-bold text-slate-500 uppercase block">Date</span>
                              <span className="text-xs font-semibold text-slate-800">{doc.extractedFields.documentDate || 'N/A'}</span>
                            </div>
                         </div>
                         
                         {doc.evidenceSignals && doc.evidenceSignals.length > 0 && (
                           <div className="space-y-2 mt-4">
                             <h5 className="text-xs font-bold text-slate-800 uppercase border-b border-slate-100 pb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-500"/> Detected Mismatches</h5>
                             {doc.evidenceSignals.map((sig: any, idx: number) => (
                               <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded text-sm">
                                  <p className="font-bold text-red-800 mb-1">{sig.title}</p>
                                  <p className="text-xs text-red-900 mb-2">{sig.description}</p>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div className="bg-white p-1.5 rounded border border-red-100">
                                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Document says</span>
                                      <span className="font-mono text-red-900">{sig.extractedValue || 'N/A'}</span>
                                    </div>
                                    <div className="bg-white p-1.5 rounded border border-red-100">
                                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Reference says</span>
                                      <span className="font-mono text-slate-800">{sig.databaseValue || 'N/A'}</span>
                                    </div>
                                  </div>
                               </div>
                             ))}
                           </div>
                         )}
                         <div className="mt-4 flex gap-2 justify-end">
                           <Button variant="outline" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold" onClick={() => window.open(doc.metadata?.downloadURL, '_blank')}>
                             OPEN DOCUMENT
                           </Button>
                           <Button size="sm" className="bg-[#0F2A43] hover:bg-[#1E3A5F] text-white font-bold" onClick={() => navigate('/verification-queue')}>
                             VERIFY EVIDENCE
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>
                 ))
               )}
            </CardContent>
          </Card>

          {/* IMAGE EVIDENCE */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader className="py-3 border-b border-slate-100">
              <Badge variant="outline" className="mb-2 bg-indigo-100 text-indigo-800 border-indigo-200 w-fit text-[10px] font-bold">SOURCE: IMAGE INTELLIGENCE</Badge>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-600" /> IMAGE EVIDENCE
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs bg-white" onClick={() => navigate('/image-intelligence')}>
                   Open Tool <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               {images.length === 0 ? (
                 <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                   <p className="text-sm text-slate-500">No images processed.</p>
                 </div>
               ) : (
                 images.map(img => (
                   <div key={img.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 bg-slate-100">
                        <img src={img.metadata?.downloadURL} alt="Site" className="w-full h-full object-cover min-h-[200px]" referrerPolicy="no-referrer" />
                      </div>
                      <div className="w-full md:w-2/3 p-4 flex flex-col">
                        <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                          <span className="font-bold text-sm text-slate-700 truncate">{img.fileName}</span>
                          <Badge className={img.processingStatus === 'COMPLETED' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                            {img.processingStatus}
                          </Badge>
                        </div>
                        {img.processingStatus === 'COMPLETED' && (
                          <div className="flex-1 space-y-3 mt-2">
                             <div>
                               <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Scene Description</span>
                               <p className="text-sm text-slate-800">{img.sceneDescription || 'N/A'}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                               <div className="bg-slate-50 p-2 rounded">
                                 <span className="text-[9px] font-bold text-slate-500 uppercase block">Visible Work Stage</span>
                                 <span className="text-xs font-semibold text-slate-800">{img.visibleWorkStage || 'N/A'}</span>
                               </div>
                               <div className="bg-slate-50 p-2 rounded">
                                 <span className="text-[9px] font-bold text-slate-500 uppercase block">Confidence</span>
                                 <span className="text-xs font-semibold text-slate-800">{img.confidence || 'N/A'}</span>
                               </div>
                             </div>
                             
                             {img.observations && img.observations.length > 0 && (
                               <div>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Observations</span>
                                 <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                                   {img.observations.map((o: string, idx: number) => (
                                     <li key={idx}>{o}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}

                             {img.visibleText && img.visibleText.length > 0 && (
                               <div>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Visible Text</span>
                                 <ul className="list-disc pl-4 text-xs font-mono text-slate-700 space-y-1">
                                   {img.visibleText.map((t: string, idx: number) => (
                                     <li key={idx}>{t}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                             
                             {img.evidenceSignals && img.evidenceSignals.length > 0 && (
                               <div className="mt-3">
                                 {img.evidenceSignals.map((sig: any, idx: number) => (
                                   <div key={idx} className="bg-amber-50 border border-amber-200 p-2 rounded text-sm">
                                      <p className="font-bold text-amber-800 mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> {sig.title}</p>
                                      <p className="text-xs text-amber-900">{sig.description}</p>
                                   </div>
                                 ))}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                   </div>
                 ))
               )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL: GIS, Timeline, Actions */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* GIS CONTEXT */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="py-3 border-b border-slate-100">
              <Badge variant="outline" className="mb-2 bg-emerald-100 text-emerald-800 border-emerald-200 w-fit text-[10px] font-bold">SOURCE: GIS CONTEXT</Badge>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" /> GIS CONTEXT
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(!project.lat || !project.lng) ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center">
                  <MapPin className="h-6 w-6 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Location data unavailable.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.1 }}></div>
                     <div className="flex flex-col items-center z-10 bg-white/90 p-2 rounded-lg shadow-sm border border-emerald-200">
                       <MapPin className="h-5 w-5 text-emerald-600 mb-1" />
                       <span className="text-xs font-mono font-bold text-slate-700">{project.lat}, {project.lng}</span>
                     </div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded text-xs text-emerald-800 text-center font-medium">
                    Verified District: {project.district}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* EVIDENCE TIMELINE */}
          <Card className="border-slate-200 shadow-sm bg-white">
             <CardHeader className="py-3 border-b border-slate-100">
               <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                 <History className="h-4 w-4 text-slate-500" /> EVIDENCE TIMELINE
               </CardTitle>
             </CardHeader>
             <CardContent className="p-4 max-h-[400px] overflow-auto">
               <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                 {auditLogs.length === 0 ? (
                    <p className="text-sm text-slate-500 pl-4">No audit events found.</p>
                 ) : (
                   auditLogs.map((log, idx) => (
                     <div key={log.id} className="relative pl-6">
                       <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm"></div>
                       <p className="text-xs font-bold text-slate-800 leading-none mb-1">{log.action.replace(/_/g, ' ')}</p>
                       <p className="text-[10px] font-mono text-slate-500 mb-1">{new Date(log.timestamp).toLocaleString()}</p>
                       <p className="text-[10px] text-slate-600 flex items-center gap-1"><User className="h-3 w-3"/> {log.actor}</p>
                     </div>
                   ))
                 )}
               </div>
             </CardContent>
          </Card>

          {/* INVESTIGATION NOTES */}
          <Card className="border-slate-200 shadow-sm bg-white">
             <CardHeader className="py-3 border-b border-slate-100">
               <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-800 border-blue-200 w-fit text-[10px] font-bold">SOURCE: HUMAN REVIEW</Badge>
               <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                 <TextSearch className="h-4 w-4 text-blue-500" /> INVESTIGATION NOTES
               </CardTitle>
             </CardHeader>
             <CardContent className="p-4">
               {!vCase ? (
                 <div className="text-center py-4">
                   <p className="text-sm text-slate-500 mb-3">No active verification case.</p>
                   <Button onClick={handleCreateCase} disabled={submittingAction || !assessment} className="w-full bg-[#0F2A43] hover:bg-[#1E3A5F]">
                     {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Verification Case'}
                   </Button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <textarea 
                     className="w-full border border-slate-200 rounded p-3 text-sm min-h-[150px] bg-yellow-50 focus:bg-white transition-colors"
                     placeholder="Enter investigation notes..."
                     value={notes}
                     onChange={e => setNotes(e.target.value)}
                   />
                   
                   {vCase.status !== 'VERIFIED' && vCase.status !== 'DISMISSED' && (
                     <div className="flex gap-2">
                       <Button 
                         size="sm"
                         className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                         onClick={() => handleUpdateStatus('VERIFIED', 'Verified by Officer')}
                         disabled={submittingAction}
                       >
                         <CheckCircle2 className="h-4 w-4 mr-1" /> VERIFY
                       </Button>
                       <Button 
                         size="sm"
                         variant="outline" 
                         className="flex-1 text-red-700 border-red-200 hover:bg-red-50 font-bold"
                         onClick={() => handleUpdateStatus('DISMISSED', 'False Positive / Dismissed')}
                         disabled={submittingAction}
                       >
                         DISMISS
                       </Button>
                     </div>
                   )}
                   {vCase.status !== 'UNDER_REVIEW' && vCase.status !== 'VERIFIED' && vCase.status !== 'DISMISSED' && (
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="w-full border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold"
                        onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                        disabled={submittingAction}
                      >
                        <Search className="h-4 w-4 mr-1" /> MARK UNDER REVIEW
                      </Button>
                   )}
                 </div>
               )}
             </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
"""

with open("src/pages/ProjectDetail.tsx", "w") as f:
    f.write(code)

