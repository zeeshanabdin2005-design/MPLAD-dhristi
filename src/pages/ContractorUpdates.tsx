import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { getAllContractorUpdates } from '../services/contractorService';
import { getProjects } from '../services/projectService';
import { ContractorUpdate, MpladsProject } from '../types';
import { CalendarDays, FileImage, Loader2, RefreshCw } from 'lucide-react';
import { getSignedUrl } from '../services/supabaseStorageService';

export function ContractorUpdates() {
  const [updates, setUpdates] = useState<ContractorUpdate[]>([]);
  const [projects, setProjects] = useState<Record<string, MpladsProject>>({});
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [allProjects, allUpdates] = await Promise.all([getProjects(), getAllContractorUpdates()]);
      setProjects(Object.fromEntries(allProjects.map(p => [p.id, p])));
      setUpdates(allUpdates.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const [photoError, setPhotoError] = useState<string | null>(null);

  const openPhoto = async (path: string) => {
    setPhotoError(null);
    const url = await getSignedUrl(path);
    if (url && url.trim()) {
      setPhotoUrl(url.trim());
    } else {
      setPhotoError('Could not retrieve a secure evidence URL for this photo.');
    }
  };

  return <div className="max-w-7xl mx-auto space-y-6 pb-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Field reporting</p><h1 className="text-3xl font-bold text-[#0F2A43] mt-1">Contractor Weekly Updates</h1><p className="text-slate-500 mt-2">Review dated progress submissions, field notes, blockers and attached site evidence.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button></div>
    {photoError && (
      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
        <span>{photoError}</span>
        <Button size="sm" variant="ghost" onClick={() => setPhotoError(null)}>Dismiss</Button>
      </div>
    )}
    <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-[#0F2A43]">Latest submissions</CardTitle><CardDescription>Contractor-reported information is evidence for review; it does not automatically overwrite the authoritative project record.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-[10px] uppercase tracking-wider text-slate-400"><th className="py-3 pr-4">Contractor</th><th className="py-3 pr-4">Project</th><th className="py-3 pr-4">Week</th><th className="py-3 pr-4">Progress</th><th className="py-3 pr-4">Work completed</th><th className="py-3 pr-4">Blockers</th><th className="py-3">Evidence</th></tr></thead><tbody>{updates.map(u => <tr key={u.id} className="border-b border-slate-100 align-top"><td className="py-4 pr-4"><p className="font-semibold text-slate-800">{u.contractorName}</p><p className="text-[10px] text-slate-400">{u.contractorEmail}</p></td><td className="py-4 pr-4"><p className="font-mono text-xs">{u.projectId}</p><p className="text-xs text-slate-500">{projects[u.projectId]?.name || projects[u.projectId]?.projectType || projects[u.projectId]?.constituency || 'Project'}</p></td><td className="py-4 pr-4 whitespace-nowrap"><span className="flex items-center gap-1 text-xs"><CalendarDays className="h-3 w-3" />{u.weekEnding}</span></td><td className="py-4 pr-4"><Badge variant="success">{u.physicalProgress}%</Badge></td><td className="py-4 pr-4 min-w-[220px] text-xs text-slate-600">{u.workCompleted}</td><td className="py-4 pr-4 min-w-[180px] text-xs text-slate-600">{u.blockers || '—'}</td><td className="py-4">{u.photoPath ? <Button size="sm" variant="outline" onClick={() => openPhoto(u.photoPath!)}><FileImage className="h-3.5 w-3.5 mr-1" />View photo</Button> : <span className="text-xs text-slate-400">No photo</span>}</td></tr>)}</tbody></table>{loading && <div className="py-10 text-center text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading submissions…</div>}{!loading && updates.length === 0 && <div className="py-10 text-center text-sm text-slate-500">No contractor weekly updates have been submitted.</div>}</div></CardContent></Card>
    {photoUrl ? <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 flex items-center justify-center" onClick={() => setPhotoUrl(null)}><div className="max-w-4xl max-h-[90vh] bg-white rounded-xl p-3" onClick={e => e.stopPropagation()}><img src={photoUrl} alt="Site evidence" className="max-h-[80vh] max-w-full object-contain rounded" /><div className="flex justify-end mt-2"><Button variant="outline" onClick={() => setPhotoUrl(null)}>Close</Button></div></div></div> : null}
  </div>;
}
