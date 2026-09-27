import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileSearch, ScanLine, UploadCloud, Loader2, FileText, CheckCircle2, AlertTriangle, ArrowRight, XCircle } from 'lucide-react';
import { getProjects } from '../services/projectService';
import { uploadDocument, getProjectDocuments } from '../services/evidenceService';
import { MpladsProject, ProjectDocument } from '../types';
import { formatNumber } from '../lib/utils';

export function DocumentIntelligence() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MpladsProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [ephemeralResults, setEphemeralResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const handleDocumentProcessed = (e: any) => {
      const { documentId, updatePayload } = e.detail;
      setEphemeralResults(prev => ({ ...prev, [documentId]: updatePayload }));
    };
    window.addEventListener('documentProcessed', handleDocumentProcessed);
    return () => window.removeEventListener('documentProcessed', handleDocumentProcessed);
  }, []);


  useEffect(() => {
    const init = async () => {
      try {
        const fetched = await getProjects();
        setProjects(fetched);
        if (fetched.length > 0) {
          setSelectedProjectId(fetched[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadDocuments(selectedProjectId);
    }
  }, [selectedProjectId]);

  const displayDocuments = documents.map(doc => {
    if (ephemeralResults[doc.id]) {
      return { ...doc, ...ephemeralResults[doc.id] };
    }
    return doc;
  });

  const loadDocuments = async (pid: string) => {
    try {
      const docs = await getProjectDocuments(pid);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProjectId) return;
    
    // Basic validation
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB allowed.");
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file type. Please upload PDF, JPG, PNG, CSV, or TXT.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setErrorMsg(null);
      setSuccessMsg(null);
      
      await uploadDocument(file, selectedProjectId, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      
      setSuccessMsg("Document uploaded successfully."); setTimeout(() => setSuccessMsg(null), 3000);
      await loadDocuments(selectedProjectId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Upload failed: ${err.message || 'Permission denied or network error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <FileSearch className="h-8 w-8 text-amber-600" />
            Document Intelligence
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            OCR analysis and extraction for invoices, bills, and project reports.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <label className="text-sm font-semibold text-slate-700 ml-2">Project:</label>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-sm border-slate-200 rounded p-1.5 min-w-[200px]"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
         <Card className="lg:col-span-1 border-slate-200 shadow-sm flex flex-col min-h-[400px]">
           <CardHeader className="bg-slate-50 border-b border-slate-100">
             <CardTitle className="text-slate-800 flex items-center gap-2">
               <FileText className="h-5 w-5 text-slate-500" /> Documents
             </CardTitle>
             <CardDescription>Upload and manage project documents</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 p-4 flex flex-col gap-4">
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading || !selectedProjectId}
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.csv,.txt"
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
                    <p className="text-sm font-medium text-slate-700">Uploading... {uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Click or drag document to upload</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, CSV up to 10MB</p>
                  </>
                )}
              </div>
              
              <div className="flex-1 overflow-auto space-y-2 mt-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Uploaded Files</h3>
                {displayDocuments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No documents found for this project.</p>
                ) : (
                  displayDocuments.map(doc => (
                    <div key={doc.id} className="p-3 border border-slate-200 rounded-lg bg-white flex items-center gap-3 hover:border-amber-300 cursor-pointer transition-colors">
                      <div className="h-10 w-10 bg-amber-50 rounded flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                           {doc.processingStatus === 'PENDING' ? (
                             <><Loader2 className="h-3 w-3 animate-spin text-amber-500" /> Pending</>
                           ) : doc.processingStatus === 'PROCESSING' ? (
                             <><Loader2 className="h-3 w-3 animate-spin text-indigo-500" /> Processing AI</>
                           ) : doc.processingStatus === 'FAILED' ? (
                             <><span className="text-red-500 font-bold">Failed</span></>
                           ) : (
                             <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Extracted</>
                           )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </CardContent>
         </Card>
         
         <Card className="lg:col-span-2 border-slate-200 shadow-sm flex flex-col min-h-[400px]">
           <CardHeader className="bg-slate-50 border-b border-slate-100">
             <CardTitle className="text-slate-800 flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-indigo-500" /> Extraction Analysis
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
              {displayDocuments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <ScanLine className="h-16 w-16 mb-4 opacity-20" />
                   <p>Select or upload a document to view AI extraction results.</p>
                </div>
              ) : ['PENDING', 'PROCESSING'].includes(displayDocuments[0].processingStatus) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                   <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                   <p className="font-semibold">{displayDocuments[0].processingStatus === 'PENDING' ? 'AI Extraction Pending' : 'Processing AI...'}</p>
                   <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">The document has been securely stored. OCR and semantic extraction are running on the server.</p>
                </div>
              ) : displayDocuments[0].processingStatus === 'FAILED' ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                   <p className="font-semibold text-red-500">AI Extraction Failed</p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                     <div>
                       <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                         <CheckCircle2 className="h-5 w-5 text-indigo-600" /> AI Extraction Completed
                       </h3>
                       <p className="text-xs text-indigo-700">Model: {displayDocuments[0].model || 'gemini-3.8-flash'}</p>
                     </div>
                     <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded uppercase">Verified by AI</span>
                   </div>
                   
                   {displayDocuments[0].extractedFields && Object.keys(displayDocuments[0].extractedFields).length > 0 && (
                     <div className="grid grid-cols-2 gap-4">
                       {Object.entries(displayDocuments[0].extractedFields).map(([k, v]: any) => (
                         <div key={k} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                           <p className="text-[10px] uppercase font-bold text-slate-500">{k}</p>
                           <p className="text-sm font-medium text-slate-800">{v?.value !== null ? String(v.value) : 'Not found'}</p>
                           {v?.confidence && <p className="text-[10px] text-emerald-600 mt-1">Conf: {(v.confidence * 100).toFixed(0)}%</p>}
                         </div>
                       ))}
                     </div>
                   )}

                   {displayDocuments[0].evidenceSignals && displayDocuments[0].evidenceSignals.length > 0 && (
                     <div className="mt-4 space-y-2">
                       <h4 className="text-sm font-bold text-slate-800">Identified Evidence Signals</h4>
                       {displayDocuments[0].evidenceSignals.map((sig: any, idx: number) => (
                         <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                           <p className="text-sm font-bold text-amber-800">{sig.title}</p>
                           <p className="text-xs text-amber-700">{sig.description}</p>
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {displayDocuments[0].evidenceSignals && displayDocuments[0].evidenceSignals.length > 0 && (
                      <div className="mt-8 flex justify-end">
                        <Button 
                          className="gap-2"
                          onClick={() => {
                             // Ephemeral passthrough to Verification Queue
                             navigate('/verification-queue', { 
                               state: { 
                                 ephemeralSignals: displayDocuments[0].evidenceSignals,
                                 projectId: selectedProjectId,
                                 document: displayDocuments[0]
                               } 
                             });
                          }}
                        >
                          VERIFY EVIDENCE <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                   )}
                </div>
              )}
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
