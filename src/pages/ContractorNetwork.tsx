import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Network, Search, AlertCircle, ArrowRight, CheckCircle2, Clock3, XCircle, Loader2 } from 'lucide-react';
import { getAllContractorAssignments, setAssignmentStatus } from '../services/contractorService';
import { getProjectById } from '../services/projectService';
import { ContractorAssignment, MpladsProject } from '../types';
import { useNavigate } from 'react-router-dom';

export function ContractorNetwork() {
  const navigate = useNavigate();
  const [requests, setRequests] = React.useState<ContractorAssignment[]>([]);
  const [requestProjects, setRequestProjects] = React.useState<Record<string, MpladsProject | null>>({});
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [actionId, setActionId] = React.useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const all = await getAllContractorAssignments();
      const pending = all.filter(a => a.status === 'REQUESTED');
      setRequests(pending);
      const pairs = await Promise.all(pending.map(async a => [a.projectId, await getProjectById(a.projectId)] as const));
      setRequestProjects(Object.fromEntries(pairs));
    } catch (e) { console.error('Failed to load contractor access requests', e); }
    finally { setLoadingRequests(false); }
  };
  React.useEffect(() => { void loadRequests(); }, []);

  const decideRequest = async (id: string, status: 'ACTIVE' | 'REVOKED') => {
    try { setActionId(id); await setAssignmentStatus(id, status); await loadRequests(); }
    catch (e: any) { alert(e?.message || 'Unable to update request.'); }
    finally { setActionId(null); }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <Network className="h-8 w-8 text-indigo-600" />
            Contractor Network Intelligence
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Analyze contractor relationships, concentration risks, and historical execution patterns.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-slate-800 flex items-center gap-2"><Clock3 className="h-5 w-5 text-indigo-600" /> Contractor Project Access Requests</CardTitle>
          <CardDescription>Review contractor requests before they can submit weekly progress for a project.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRequests ? <div className="p-8 flex items-center justify-center text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading requests…</div> : requests.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No pending contractor access requests.</div> : <div className="divide-y divide-slate-100">{requests.map(request => { const project = requestProjects[request.projectId]; return <div key={request.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-semibold text-slate-800">{request.contractorName}</span><Badge variant="warning">REQUESTED</Badge></div><p className="text-xs text-slate-500 mt-1">{request.contractorEmail} · {request.projectId}</p><p className="text-sm font-medium text-slate-700 mt-1">{project?.name || project?.projectType || project?.constituency || 'Project record'}</p></div>
            <div className="flex gap-2 shrink-0"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={actionId === request.id} onClick={() => decideRequest(request.id, 'ACTIVE')}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button><Button size="sm" variant="outline" disabled={actionId === request.id} onClick={() => decideRequest(request.id, 'REVOKED')}><XCircle className="h-4 w-4 mr-1" /> Reject</Button></div>
          </div>; })}</div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-800">Entity Relationship Graph</CardTitle>
            <CardDescription>Visualizing project concentration by contractor entity</CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[450px] relative bg-slate-50 flex items-center justify-center overflow-hidden">
             {/* Synthetic Network Graph Representation */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             <div className="relative w-full h-full max-w-xl mx-auto">
                {/* Central Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                   <div className="w-16 h-16 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 border-4 border-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-xs">C-018</span>
                   </div>
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded shadow-sm">ABC Construction</div>
                </div>

                {/* Connecting lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                  <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#CBD5E1" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="30%" y2="80%" stroke="#EF4444" strokeWidth="2" />
                </svg>

                {/* Satellite Nodes */}
                <div className="absolute top-[30%] left-[20%] -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform" onClick={() => navigate('/projects/P-2381')}>
                   <div className="w-10 h-10 bg-slate-300 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-slate-600 font-bold text-[8px]">P-2381</span>
                   </div>
                </div>
                
                <div className="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform">
                   <div className="w-10 h-10 bg-emerald-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-white font-bold text-[8px]">P-8821</span>
                   </div>
                </div>

                <div className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform">
                   <div className="w-10 h-10 bg-emerald-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-white font-bold text-[8px]">P-9912</span>
                   </div>
                </div>

                <div className="absolute top-[80%] left-[30%] -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-transform" onClick={() => navigate('/projects/P-1042')}>
                   <div className="w-12 h-12 bg-red-500 rounded-full border-2 border-white shadow-md shadow-red-500/20 flex items-center justify-center">
                      <span className="text-white font-bold text-[10px]">P-1042</span>
                   </div>
                   <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">High Risk</div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-slate-800">Entity Details</CardTitle>
            <CardDescription>Concentration detected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
               <div className="flex items-center justify-between mb-1">
                 <h3 className="font-bold text-lg text-[#0F2A43]">ABC Construction Group</h3>
                 <Badge variant="outline" className="bg-slate-100 text-slate-700">C-018</Badge>
               </div>
               <p className="text-sm text-slate-500">Registered: Bhopal, Madhya Pradesh</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
               <div>
                  <p className="text-sm font-semibold text-amber-800">Relationship Signal</p>
                  <p className="text-xs text-amber-700 mt-1">This entity holds 8 active projects in the Bhopal district simultaneously, representing 45% of total district allocation.</p>
               </div>
            </div>

            <div className="space-y-3">
               <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Active Projects (4)</h4>
               <div className="space-y-2">
                 <div className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50 hover:border-slate-300 cursor-pointer transition-colors" onClick={() => navigate('/projects/P-1042')}>
                   <div>
                     <p className="text-sm font-medium text-slate-800">P-1042</p>
                     <p className="text-xs text-slate-500">Road Construction</p>
                   </div>
                   <Badge className="bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-0">High Risk</Badge>
                 </div>
                 <div className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50 hover:border-slate-300 cursor-pointer transition-colors" onClick={() => navigate('/projects/P-2381')}>
                   <div>
                     <p className="text-sm font-medium text-slate-800">P-2381</p>
                     <p className="text-xs text-slate-500">Water Facility</p>
                   </div>
                   <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-none border-0">Under Review</Badge>
                 </div>
                 <div className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                   <div>
                     <p className="text-sm font-medium text-slate-800">P-8821</p>
                     <p className="text-xs text-slate-500">Community Hall</p>
                   </div>
                   <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-0">On Track</Badge>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
