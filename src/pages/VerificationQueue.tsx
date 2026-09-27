import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { getProjects } from '../services/projectService';
import { getAllRiskAssessments } from '../services/riskService';
import { getAllVerificationCases, updateCaseStatus, createVerificationCase } from '../services/verificationService';
import { MpladsProject, RiskAssessment, VerificationCase } from '../types';
import { CheckCircle, AlertTriangle, FileSearch, MapPin, Loader2, ShieldCheck, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function VerificationQueue() {
  const navigate = useNavigate();
  const location = useLocation();
  const ephemeralState = location.state as any;
  
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const [fetchedProjects, fetchedAssessments, fetchedCases] = await Promise.all([
        getProjects(),
        getAllRiskAssessments(),
        getAllVerificationCases()
      ]);

      const casesMap = new Map(fetchedCases.map(c => [c.projectId, c]));

      const targetAssessments = fetchedAssessments.filter(a => a.level === 'HIGH' || a.level === 'CRITICAL' || a.level === 'MEDIUM');
      
      const items = targetAssessments.map(assessment => {
        const project = fetchedProjects.find(p => p.id === assessment.projectId);
        let vCase = casesMap.get(assessment.projectId);
        return {
          assessment,
          project: project || { id: assessment.projectId, name: 'Unknown Project' } as MpladsProject,
          vCase
        };
      }).sort((a, b) => b.assessment.score - a.assessment.score);
      
      setQueueItems(items);

      // Inject Ephemeral Document Intelligence Signals
      if (ephemeralState && ephemeralState.ephemeralSignals) {
         const project = fetchedProjects.find(p => p.id === ephemeralState.projectId);
         if (project) {
           const ephemeralItem = {
             isEphemeral: true,
             document: ephemeralState.document,
             signals: ephemeralState.ephemeralSignals,
             project,
             sourceLabel: 'DOCUMENT INTELLIGENCE',
             vCase: { status: 'PENDING' } // Fake vcase for UI
           };
           // Put it at the top of the queue
           setQueueItems(prev => [ephemeralItem, ...prev]);
         }
      }

      // Inject Ephemeral Image Intelligence Signals
      if (ephemeralState && ephemeralState.ephemeralImageSignals) {
         const project = fetchedProjects.find(p => p.id === ephemeralState.projectId);
         if (project) {
           const ephemeralItem = {
             isEphemeral: true,
             image: ephemeralState.image,
             signals: ephemeralState.ephemeralImageSignals,
             project,
             sourceLabel: 'IMAGE INTELLIGENCE',
             vCase: { status: 'PENDING' } // Fake vcase for UI
           };
           // Put it at the top of the queue
           setQueueItems(prev => [ephemeralItem, ...prev]);
         }
      }
    } catch (err) {
      console.error('Error fetching verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: any, action: VerificationCase['status'], decision: string) => {
    try {
      let caseId = item.vCase?.id;
      if (!caseId) {
        // Create the case first if it doesn't exist
        const newCase = await createVerificationCase(item.project.id, item.assessment);
        caseId = newCase.id;
      }
      
      await updateCaseStatus(caseId, item.project.id, action, 'Action taken from quick queue', decision);
      
      // Reload queue to reflect status
      await loadQueue();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              Verification Queue
            </h1>
          </div>
        </div>
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-slate-200 shadow-sm">
           <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
           <p className="text-slate-500 font-medium">Loading verification queue...</p>
        </Card>
      </div>
    );
  }

  // Filter out cases that are already closed/verified unless we want to show history.
  // For the active queue, let's hide VERIFIED and DISMISSED
  const activeItems = queueItems.filter(item => 
    !item.vCase || (item.vCase.status !== 'VERIFIED' && item.vCase.status !== 'DISMISSED')
  );

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            Verification Queue
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Officer review workspace for AI-flagged projects requiring human validation.
          </p>
        </div>
      </div>
      <Card className="border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
           <div>
             <CardTitle className="text-slate-800">Pending Actions ({activeItems.length})</CardTitle>
             <CardDescription>Review evidence and determine next steps</CardDescription>
           </div>
        </CardHeader>
        <div className="overflow-x-auto flex-1 bg-slate-50 p-6">
          <div className="flex flex-col gap-4">
            {activeItems.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                 <ShieldCheck className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                 <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
                 <p className="text-slate-500">No pending verification cases.</p>
               </div>
            ) : (
              <table className="w-full text-sm text-left bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold tracking-wider">Project</th>
                    <th className="px-4 py-3 font-semibold tracking-wider">Source</th>
                    <th className="px-4 py-3 font-semibold tracking-wider">Signal</th>
                    <th className="px-4 py-3 font-semibold tracking-wider">Severity</th>
                    <th className="px-4 py-3 font-semibold tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold tracking-wider">Updated At</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeItems.map((item, idx) => {
                    const isEphemeral = item.isEphemeral;
                    const proj = item.project;
                    let source = isEphemeral ? item.sourceLabel : 'RULE ENGINE';
                    let signal = isEphemeral ? item.signals[0]?.title : item.assessment?.signals?.[0]?.title || 'Anomaly Detected';
                    let severity = isEphemeral ? 'MEDIUM' : item.assessment?.level || 'MEDIUM';
                    let status = item.vCase?.status || 'PENDING';
                    let updatedAt = item.vCase?.updatedAt ? new Date(item.vCase.updatedAt).toLocaleDateString() : new Date().toLocaleDateString();

                    return (
                      <tr key={isEphemeral ? `ephemeral-${idx}` : proj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#0F2A43] cursor-pointer hover:text-blue-600" onClick={() => navigate(`/projects/${proj.id}`)}>
                            {proj.id}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[150px]">{proj.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={source === 'RULE ENGINE' ? "bg-red-50 text-red-700 border-red-200" : source.includes('DOCUMENT') ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}>
                            {source}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-slate-700 font-medium truncate max-w-[200px]" title={signal}>{signal}</span>
                          </div>
                          {isEphemeral && (
                             <span className="text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded mt-1 inline-block border border-amber-100">EPHEMERAL PREVIEW</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${severity === 'CRITICAL' || severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'}`}>
                            {severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold uppercase ${status === 'UNDER_REVIEW' ? 'text-blue-600' : 'text-amber-600'}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {updatedAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEphemeral ? (
                             <div className="flex justify-end gap-2">
                               <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 h-7 text-xs" onClick={() => {
                                   alert("In a production system, this would write to the backend. Prototype limitation reached.");
                                   setQueueItems(prev => prev.filter(i => i !== item));
                                }}>
                                 <ShieldCheck className="h-3 w-3 mr-1" /> VERIFY
                               </Button>
                               <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 h-7 text-xs" onClick={() => {
                                   alert("In a production system, this would mark it as dismissed. Prototype limitation reached.");
                                   setQueueItems(prev => prev.filter(i => i !== item));
                                }}>
                                 <XCircle className="h-3 w-3" />
                               </Button>
                             </div>
                          ) : (
                             <Button size="sm" className="bg-[#0F2A43] hover:bg-[#1E3A5F] text-white h-7 text-xs" onClick={() => navigate(`/projects/${proj.id}`)}>
                               Review Evidence <ArrowRight className="ml-1 h-3 w-3" />
                             </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
