import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Image as ImageIcon, UploadCloud, Loader2, CheckCircle2, AlertTriangle, Search, ArrowRight, XCircle } from 'lucide-react';
import { getProjects } from '../services/projectService';
import { uploadImage, getProjectImages } from '../services/evidenceService';
import { SupabaseImage } from '../components/SupabaseImage';
import { MpladsProject, ProjectImage } from '../types';
import { useNavigate } from 'react-router-dom';

export function ImageIntelligence() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MpladsProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [ephemeralResults, setEphemeralResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const handleImageProcessed = (e: any) => {
      const { imageId, updatePayload } = e.detail;
      setEphemeralResults(prev => ({ ...prev, [imageId]: updatePayload }));
    };
    window.addEventListener('imageProcessed', handleImageProcessed);
    return () => window.removeEventListener('imageProcessed', handleImageProcessed);
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
      loadImages(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadImages = async (pid: string) => {
    try {
      const imgs = await getProjectImages(pid);
      setImages(imgs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedProjectId) return;
    const file = event.target.files[0];
    
    setUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);
    try {
      await uploadImage(file, selectedProjectId, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      await loadImages(selectedProjectId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Upload failed: ${err.message || 'Permission denied or network error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const displayImages = images.map(img => {
    if (ephemeralResults[img.id]) {
      return { ...img, ...ephemeralResults[img.id] };
    }
    return img;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-indigo-600" />
            Image Intelligence
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Computer vision comparison and observation extraction for site photographs.
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
               <UploadCloud className="h-5 w-5 text-slate-500" /> Site Photos
             </CardTitle>
           </CardHeader>
           <CardContent className="flex-1 p-4 flex flex-col gap-4">
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading || !selectedProjectId}
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.webp"
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
                    <p className="text-sm font-medium text-slate-700">Uploading... {uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Upload site photograph</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP up to 15MB</p>
                  </>
                )}
              </div>
              
              <div className="flex-1 overflow-auto space-y-2 mt-4 grid grid-cols-2 gap-2">
                {displayImages.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 col-span-2">No images uploaded for this project.</p>
                ) : (
                  displayImages.map(img => (
                    <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 group relative">
                      <SupabaseImage storagePath={img.storagePath} fallbackUrl={img.metadata?.downloadURL} alt={img.fileName} className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
                      <div className="p-2">
                        <p className="text-[10px] font-medium text-slate-700 truncate" title={img.fileName}>{img.fileName}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                           {img.processingStatus === 'PENDING' ? (
                             <><Loader2 className="h-2 w-2 animate-spin text-amber-500" /> Pending</>
                           ) : img.processingStatus === 'PROCESSING' ? (
                             <><Loader2 className="h-2 w-2 animate-spin text-indigo-500" /> Processing AI</>
                           ) : img.processingStatus === 'FAILED' ? (
                             <><span className="text-red-500 font-bold">Failed</span></>
                           ) : (
                             <><CheckCircle2 className="h-2 w-2 text-emerald-500" /> Analyzed</>
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
                <Search className="h-5 w-5 text-indigo-500" /> Image Extraction & Analysis
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
              {displayImages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                   <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                   <p>Upload an image to run visual analysis.</p>
                </div>
              ) : ['PENDING', 'PROCESSING'].includes(displayImages[0].processingStatus) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                   <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                   <p className="font-semibold">{displayImages[0].processingStatus === 'PENDING' ? 'AI Analysis Pending' : 'Processing AI...'}</p>
                   <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">The image has been securely stored. Multimodal vision models are analyzing the scene on the server.</p>
                </div>
              ) : displayImages[0].processingStatus === 'FAILED' ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                   <p className="font-semibold text-red-500">AI Analysis Failed</p>
                </div>
              ) : (
                <div className="space-y-6">
                   
                   <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                     <div>
                       <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                         <CheckCircle2 className="h-5 w-5 text-indigo-600" /> AI Vision Completed
                       </h3>
                       <p className="text-xs text-indigo-700">Model: {displayImages[0].model || 'gemini-3.8-flash'}</p>
                     </div>
                     <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded uppercase">Visual Evidence</span>
                   </div>

                   <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                       <SupabaseImage storagePath={displayImages[0].storagePath} fallbackUrl={displayImages[0].metadata?.downloadURL} alt="Analysis" className="w-full rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                       <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                         <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Scene Description</h3>
                         <p className="text-sm text-slate-800">{displayImages[0].sceneDescription}</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                           <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Visible Work Stage</p>
                           <p className="text-sm font-medium text-slate-800">{displayImages[0].visibleWorkStage}</p>
                         </div>
                         <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                           <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Confidence</p>
                           <p className="text-sm font-medium text-slate-800">{displayImages[0].confidence || "Unknown"}</p>
                         </div>
                       </div>
                       
                       {displayImages[0].observations && displayImages[0].observations.length > 0 && (
                         <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                           <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Observations</p>
                           <ul className="list-disc pl-4 space-y-1 text-sm text-slate-700">
                             {displayImages[0].observations.map((obs: string, idx: number) => (
                               <li key={idx}>{obs}</li>
                             ))}
                           </ul>
                         </div>
                       )}
                       
                       {displayImages[0].visibleText && displayImages[0].visibleText.length > 0 && (
                         <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                           <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Visible Text</p>
                           <ul className="list-disc pl-4 space-y-1 text-sm text-slate-700 font-mono">
                             {displayImages[0].visibleText.map((text: string, idx: number) => (
                               <li key={idx}>"{text}"</li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>

                   {displayImages[0].evidenceSignals && displayImages[0].evidenceSignals.length > 0 && (
                     <div className="mt-4 space-y-2">
                       <h4 className="text-sm font-bold text-slate-800">Visual Anomaly Signals</h4>
                       {displayImages[0].evidenceSignals.map((sig: any, idx: number) => (
                         <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                           <p className="text-sm font-bold text-amber-800 flex items-center gap-1">
                             <AlertTriangle className="h-4 w-4" /> {sig.title}
                           </p>
                           <p className="text-xs text-amber-700 mt-1">{sig.description}</p>
                           <div className="mt-2 text-xs grid grid-cols-2 gap-2 text-slate-600">
                             <div><span className="font-bold text-slate-500">Reported:</span> {sig.databaseValue}</div>
                             <div><span className="font-bold text-slate-500">Observed:</span> {sig.extractedValue}</div>
                           </div>
                         </div>
                       ))}
                       
                       <div className="mt-8 flex justify-end">
                        <Button 
                          className="gap-2"
                          onClick={() => {
                             navigate('/verification-queue', { 
                               state: { 
                                 ephemeralImageSignals: displayImages[0].evidenceSignals,
                                 projectId: selectedProjectId,
                                 image: displayImages[0]
                               } 
                             });
                          }}
                        >
                          VERIFY EVIDENCE <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
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
