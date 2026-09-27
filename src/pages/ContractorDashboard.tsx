import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/projectService';
import { getMyAssignments, getMyContractorUpdates, requestProjectAccess, submitContractorUpdate } from '../services/contractorService';
import { uploadFileToSupabase } from '../services/supabaseStorageService';
import { logAudit } from '../services/evidenceService';
import { ContractorAssignment, ContractorUpdate, MpladsProject } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileImage, HardHat, LogOut, MapPin, Send, ShieldCheck, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ContractorDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MpladsProject[]>([]);
  const [assignments, setAssignments] = useState<ContractorAssignment[]>([]);
  const [updates, setUpdates] = useState<ContractorUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<MpladsProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [accessMsg, setAccessMsg] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ weekEnding: new Date().toISOString().slice(0,10), physicalProgress: '', expenditureThisWeek: '', workCompleted: '', blockers: '', nextWeekPlan: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [allProjects, myAssignments, myUpdates] = await Promise.all([getProjects(), getMyAssignments(), getMyContractorUpdates()]);
      setProjects(allProjects); setAssignments(myAssignments); setUpdates(myUpdates);
    } catch (e: any) { setAccessMsg(e?.message || 'Could not load contractor workspace.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const activeIds = useMemo(() => new Set(assignments.filter(a => a.status === 'ACTIVE').map(a => a.projectId)), [assignments]);
  const requestedIds = useMemo(() => new Set(assignments.filter(a => a.status === 'REQUESTED').map(a => a.projectId)), [assignments]);
  const activeProjects = projects.filter(p => activeIds.has(p.id));
  const latestFor = (projectId: string) => updates.find(u => u.projectId === projectId);

  const requestAccess = async (project: MpladsProject) => {
    try { setAccessMsg(''); await requestProjectAccess(project); setAccessMsg(`Access request submitted for ${project.id}. An officer must approve it before updates can be submitted.`); await load(); }
    catch (e: any) { setAccessMsg(e?.message || 'Unable to request project access.'); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const progress = Number(form.physicalProgress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) { setAccessMsg('Physical progress must be between 0 and 100%.'); return; }
    const previous = latestFor(selectedProject.id)?.physicalProgress ?? selectedProject.pctCompleted ?? 0;
    if (progress < previous) { setAccessMsg(`Progress cannot decrease below the latest recorded level (${previous}%). If a correction is needed, explain it in Notes.`); return; }
    if (!form.workCompleted.trim() || !form.nextWeekPlan.trim()) { setAccessMsg('Work completed and next week plan are required.'); return; }
    if (updates.some(u => u.projectId === selectedProject.id && u.weekEnding === form.weekEnding)) { setAccessMsg('A weekly update for this project and week has already been submitted.'); return; }
    setSaving(true); setAccessMsg('');
    try {
      let photoPath: string | null = null;
      if (file) {
        const safe = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase().slice(0, 120);
        const updateId = `UPD_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
        const path = `projects/${selectedProject.id}/contractor-updates/${updateId}_${safe}`;
        const uploaded = await uploadFileToSupabase(file, path, undefined, 'contractor-updates', updateId, selectedProject.id);
        photoPath = uploaded.path;
      }
      await submitContractorUpdate({ projectId: selectedProject.id, weekEnding: form.weekEnding, physicalProgress: progress, previousProgress: previous, expenditureThisWeek: form.expenditureThisWeek === '' ? null : Number(form.expenditureThisWeek), workCompleted: form.workCompleted.trim(), blockers: form.blockers.trim(), nextWeekPlan: form.nextWeekPlan.trim(), notes: form.notes.trim(), photoPath, photoFileName: file?.name || null });
      await logAudit(selectedProject.id, 'CONTRACTOR_WEEKLY_UPDATE_SUBMITTED', { weekEnding: form.weekEnding, physicalProgress: progress, hasPhoto: !!photoPath });
      setAccessMsg('Weekly progress submitted successfully. The submission is now visible to monitoring officers.');
      setSelectedProject(null); setFile(null); setForm({ weekEnding: new Date().toISOString().slice(0,10), physicalProgress: '', expenditureThisWeek: '', workCompleted: '', blockers: '', nextWeekPlan: '', notes: '' });
      await load();
    } catch (e: any) { setAccessMsg(e?.message || 'Failed to submit weekly progress.'); }
    finally { setSaving(false); }
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="h-20 bg-[#0F2A43] text-white flex items-center justify-between px-6 md:px-10 shadow-lg">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center"><HardHat className="h-5 w-5" /></div><div><div className="font-bold tracking-tight">MPLADS-DRISHTI</div><div className="text-[10px] text-indigo-200 uppercase tracking-widest">Contractor Progress Portal</div></div></div>
      <div className="flex items-center gap-4"><div className="hidden md:block text-right"><p className="text-sm font-semibold">{profile?.fullName || user?.email}</p><p className="text-[10px] text-slate-300">{profile?.contractorCompany || 'Contractor'}</p></div><button onClick={signOut} className="p-2 rounded hover:bg-white/10"><LogOut className="h-4 w-4" /></button></div>
    </header>
    <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Field execution workspace</p><h1 className="text-3xl font-bold text-[#0F2A43] mt-1">Weekly Progress & Site Updates</h1><p className="text-slate-500 mt-2 max-w-2xl">Submit a dated weekly progress record for each approved project. Every submission is retained as an auditable evidence event.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => navigate('/contractor')}><Activity className="h-4 w-4 mr-2" />Refresh</Button><div className="px-3 py-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified account</div></div></div>
      {accessMsg && <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 text-sm text-indigo-800">{accessMsg}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Stat title="Active Projects" value={activeProjects.length} icon={<CheckCircle2 className="h-5 w-5" />} /><Stat title="Pending Requests" value={assignments.filter(a => a.status === 'REQUESTED').length} icon={<Clock3 className="h-5 w-5" />} /><Stat title="Weekly Submissions" value={updates.length} icon={<CalendarDays className="h-5 w-5" />} /></div>

      <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-[#0F2A43]">My Assigned Projects</CardTitle><CardDescription>Only officer-approved projects can receive contractor progress submissions.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{activeProjects.length === 0 ? <Empty text="No active project assignments yet. Request access to a project below." /> : activeProjects.map(project => { const latest = latestFor(project.id); return <div key={project.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-slate-400">{project.id}</p><h3 className="font-bold text-slate-800 mt-1">{project.name || project.projectType || 'MPLADS Project'}</h3><p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{project.district || project.constituency}, {project.state}</p></div><Badge variant="success">ACTIVE</Badge></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-500">Latest progress</span><b className="text-indigo-700">{latest?.physicalProgress ?? project.pctCompleted ?? 0}%</b></div><div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, latest?.physicalProgress ?? project.pctCompleted ?? 0))}%` }} /></div><Button className="w-full mt-4 bg-[#0F2A43] hover:bg-[#1E3A5F] text-white" onClick={() => { setSelectedProject(project); setForm(f => ({ ...f, physicalProgress: String(latest?.physicalProgress ?? project.pctCompleted ?? 0) })); }}>Submit Weekly Update <ArrowRight className="h-4 w-4 ml-2" /></Button></div>; })}</div></CardContent></Card>

      <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-[#0F2A43]">Request Project Access</CardTitle><CardDescription>Select the project you have been engaged to execute. An officer reviews and activates access.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{projects.slice(0, 60).map(project => { const active = activeIds.has(project.id); const requested = requestedIds.has(project.id); return <div key={project.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] text-slate-400">{project.id}</p><p className="text-sm font-semibold text-slate-800 truncate">{project.name || project.projectType || project.constituency}</p><p className="text-[10px] text-slate-500">{project.district || project.state}</p></div>{active ? <Badge variant="success">ACTIVE</Badge> : requested ? <Badge variant="warning">REQUESTED</Badge> : <Button size="sm" variant="outline" onClick={() => requestAccess(project)}>Request</Button>}</div>; })}</div></CardContent></Card>

      <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-[#0F2A43]">Submission History</CardTitle><CardDescription>Immutable-style dated records of your weekly submissions.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b"><th className="py-3 pr-4">Week ending</th><th className="py-3 pr-4">Project</th><th className="py-3 pr-4">Progress</th><th className="py-3 pr-4">Evidence</th><th className="py-3">Submitted</th></tr></thead><tbody>{updates.slice(0, 20).map(u => <tr key={u.id} className="border-b border-slate-100"><td className="py-3 pr-4 font-medium">{u.weekEnding}</td><td className="py-3 pr-4 font-mono text-xs">{u.projectId}</td><td className="py-3 pr-4 font-semibold text-indigo-700">{u.physicalProgress}%</td><td className="py-3 pr-4">{u.photoPath ? <span className="text-emerald-600 flex items-center gap-1"><FileImage className="h-3 w-3" /> Site photo</span> : <span className="text-slate-400">Text only</span>}</td><td className="py-3 text-xs text-slate-500">{new Date(u.submittedAt).toLocaleString()}</td></tr>)}</tbody></table>{updates.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">No weekly updates submitted yet.</p>}</div></CardContent></Card>
    </main>

    {selectedProject && <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm p-4 overflow-y-auto"><div className="min-h-full flex items-center justify-center"><Card className="w-full max-w-2xl shadow-2xl"><CardHeader className="border-b border-slate-100"><div className="flex items-start justify-between gap-4"><div><CardTitle className="text-[#0F2A43]">Weekly Update · {selectedProject.id}</CardTitle><CardDescription>{selectedProject.name || selectedProject.projectType || 'Project'} — submit current field status.</CardDescription></div><button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button></div></CardHeader><CardContent><form onSubmit={submit} className="space-y-5 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Week Ending" type="date" value={form.weekEnding} onChange={v => setForm({ ...form, weekEnding: v })} max={new Date().toISOString().slice(0,10)} /><Field label="Physical Progress (%)" type="number" min="0" max="100" step="0.01" value={form.physicalProgress} onChange={v => setForm({ ...form, physicalProgress: v })} /><Field label="Expenditure This Week (₹ lakh, optional)" type="number" min="0" step="0.01" value={form.expenditureThisWeek} onChange={v => setForm({ ...form, expenditureThisWeek: v })} /></div>
      <TextArea label="Work completed this week *" value={form.workCompleted} onChange={v => setForm({ ...form, workCompleted: v })} placeholder="Activities completed, quantities achieved, milestones reached..." />
      <TextArea label="Blockers / site issues" value={form.blockers} onChange={v => setForm({ ...form, blockers: v })} placeholder="Material, weather, land, labour, approval or other constraints..." />
      <TextArea label="Next week plan *" value={form.nextWeekPlan} onChange={v => setForm({ ...form, nextWeekPlan: v })} placeholder="Planned activities and target milestone..." />
      <TextArea label="Additional notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Anything the monitoring officer should know..." />
      <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50"><label className="flex items-center gap-3 cursor-pointer"><UploadCloud className="h-5 w-5 text-indigo-600" /><div><p className="text-sm font-semibold text-slate-700">Attach weekly site photo (optional)</p><p className="text-xs text-slate-500">PNG/JPG/WebP up to 15MB.</p></div><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} /></label>{file && <p className="text-xs text-emerald-600 mt-3">Selected: {file.name}</p>}</div>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setSelectedProject(null)}>Cancel</Button><Button type="submit" disabled={saving} className="bg-[#0F2A43] hover:bg-[#1E3A5F] text-white">{saving ? 'Submitting…' : <><Send className="h-4 w-4 mr-2" /> Submit Weekly Update</>}</Button></div>
    </form></CardContent></Card></div></div>}
  </div>;
}

function Stat({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) { return <Card className="border-slate-200 shadow-sm"><CardContent className="p-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{title}</p><p className="text-2xl font-bold text-[#0F2A43] mt-1">{value}</p></div><div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">{icon}</div></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <div className="col-span-full py-10 text-center text-sm text-slate-500">{text}</div>; }
function Field({ label, value, onChange, type='text', min, max, step }: { label:string; value:string; onChange:(v:string)=>void; type?:string; min?:string; max?:string; step?:string }) { return <div className="space-y-2"><label className="text-xs font-semibold text-slate-600">{label}</label><input type={type} min={min} max={max} step={step} value={value} onChange={e=>onChange(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required={label.includes('*')} /></div>; }
function TextArea({ label, value, onChange, placeholder }: { label:string; value:string; onChange:(v:string)=>void; placeholder:string }) { return <div className="space-y-2"><label className="text-xs font-semibold text-slate-600">{label}</label><textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} required={label.includes('*')} className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" /></div>; }
