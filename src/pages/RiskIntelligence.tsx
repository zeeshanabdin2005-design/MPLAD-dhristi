import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getProjects } from '../services/projectService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAllRiskAssessments } from '../services/riskService';
import { MpladsProject, RiskAssessment, RiskSignal } from '../types';
import { ShieldAlert, AlertTriangle, ArrowRight, Shield, Loader2, CheckCircle2, Activity, Database, BrainCircuit } from 'lucide-react';
import { getMlSummaryStats, getTopAnomalies } from '../services/historicalMlService';
import { HistoricalObservation, MlSummaryStats } from '../types/ml_types';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function RiskIntelligence() {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<MpladsProject[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlStats, setMlStats] = useState<MlSummaryStats | null>(null);
  const [topAnomalies, setTopAnomalies] = useState<HistoricalObservation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedProjects, fetchedAssessments] = await Promise.all([
          getProjects(),
          getAllRiskAssessments()
        ]);
        setProjects(fetchedProjects);
        setAssessments(fetchedAssessments);
        setMlStats(getMlSummaryStats());
        setTopAnomalies(getTopAnomalies(5));
      } catch (err) {
        console.error('Error fetching risk data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              Risk Intelligence
            </h1>
          </div>
        </div>
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-slate-200 shadow-sm">
           <Loader2 className="h-8 w-8 text-red-500 animate-spin mb-4" />
           <p className="text-slate-500 font-medium">Loading risk profiles...</p>
        </Card>
      </div>
    );
  }

  // Analytics
  const totalAnalyzed = assessments.length;
  const highRisk = assessments.filter(a => a.level === 'HIGH' || a.level === 'CRITICAL');
  const medRisk = assessments.filter(a => a.level === 'MEDIUM');
  const lowRisk = assessments.filter(a => a.level === 'LOW');
  
  // Aggregate signals
  const signalCounts: Record<string, number> = {};
  assessments.forEach(a => {
    a.signals.forEach(sig => {
      signalCounts[sig.type] = (signalCounts[sig.type] || 0) + 1;
    });
  });

  const radarData = Object.entries(signalCounts).map(([subject, count]) => ({
    subject,
    A: count,
    fullMark: Math.max(10, ...Object.values(signalCounts))
  })).slice(0, 6);

  // If no radar data, provide an empty state
  if (radarData.length === 0) {
    radarData.push({ subject: 'No Signals', A: 0, fullMark: 100 });
  }

  // Join High Risk with Project Names
  const investigationQueue = [...highRisk, ...medRisk].map(a => {
    const p = projects.find(proj => proj.id === a.projectId);
    return { ...a, projectName: p?.name || 'Unknown Project' };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            Risk Intelligence
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            AI-assisted anomaly detection and statistical risk prioritization across all monitoring vectors.
          </p>
          <div className="mt-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-max border border-slate-200">
            Risk scores indicate statistical anomalies requiring human verification, not confirmed fraud.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Analyzed</p>
            <p className="text-3xl font-bold text-[#0F2A43]">{totalAnalyzed}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 shadow-sm bg-red-50">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wider mb-1">High Risk</p>
            <p className="text-3xl font-bold text-red-600">{highRisk.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 shadow-sm bg-amber-50">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Medium Risk</p>
            <p className="text-3xl font-bold text-amber-600">{medRisk.length}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 shadow-sm bg-emerald-50">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">Low Risk</p>
            <p className="text-3xl font-bold text-emerald-600">{lowRisk.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-[#0B1220] border-[#1E3A5F] text-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              Risk Radar
            </CardTitle>
            <CardDescription className="text-slate-400">Aggregate anomaly distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#1E3A5F" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F2A43', borderColor: '#1E3A5F', color: '#fff' }} />
                <Radar name="Signal Frequency" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Priority Investigation Queue</CardTitle>
            <CardDescription>Projects with the highest statistical risk scores</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[400px]">
             {investigationQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-4" />
                  <p>No high or medium risk projects detected in current analysis.</p>
                </div>
             ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Project</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Risk Score</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Anomaly Vector</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {investigationQueue.map((assessment) => (
                      <tr key={assessment.projectId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0F2A43]">{assessment.projectId}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{assessment.projectName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`relative flex items-center justify-center h-8 w-8 rounded-full border-2 ${assessment.level === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
                              <span className={`font-bold text-xs ${assessment.level === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'}`}>{assessment.score}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {assessment.signals.slice(0, 2).map((sig, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <AlertTriangle className={`h-3 w-3 ${assessment.level === 'MEDIUM' ? 'text-amber-500' : 'text-red-500'}`} />
                                <span className="text-xs text-slate-600">{sig.type} (+{sig.contribution})</span>
                              </div>
                            ))}
                            {assessment.signals.length > 2 && (
                              <span className="text-[10px] text-slate-400 pl-4">+{assessment.signals.length - 2} more signals</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" onClick={() => navigate(`/projects/${assessment.projectId}`)} className="bg-[#0F2A43] hover:bg-[#1E3A5F] text-white">
                            Investigate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {Object.entries(signalCounts).map(([type, count], i) => (
            <Card key={i} className={`border border-slate-200 shadow-sm`}>
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{type}</h3>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4">
                   <span className="text-2xl font-bold text-slate-800">{count}</span>
                   <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Occurrences</span>
                </div>
              </CardContent>
            </Card>
         ))}
      </div>


      {/* HISTORICAL ML ANOMALY INTELLIGENCE */}
      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-500" />
            HISTORICAL ML ANOMALY INTELLIGENCE
          </h2>
          <p className="text-slate-500 mt-1">
            MODEL OUTPUT — HISTORICAL DATA. This section displays statistical anomalies detected by the Isolation Forest model trained on 234 historical constituency-year observations. These are completely independent from the Rule-Based Risk Engine and require verification.
          </p>
        </div>

        {mlStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Observations</p>
                    <p className="text-2xl font-bold">{mlStats.totalObservations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={mlStats.anomaliesDetected > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {mlStats.anomaliesDetected > 0 ? (
                    <Activity className="h-8 w-8 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-500">Statistical Anomalies</p>
                    <p className="text-2xl font-bold">{mlStats.anomaliesDetected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Critical Anomaly Signals</p>
                    <p className="text-2xl font-bold">{mlStats.criticalAnomalies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">High Anomaly Signals</p>
                    <p className="text-2xl font-bold">{mlStats.highAnomalies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <h3 className="text-xl font-bold mb-4">Highest Anomaly Observations</h3>
        <div className="space-y-4">
          {topAnomalies.map((obs) => (
            <Card key={obs.id} className="border-l-4 border-l-indigo-500">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold">{obs.constituency} ({obs.financialYear})</h4>
                    <div className='px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold'>
                      {obs.mlRiskCategory} ML SIGNAL
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1 mt-2">
                    {obs.evidence.map((ev, i) => (
                      <p key={i} className="flex items-start gap-1">
                        <Activity className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                        <span>{ev}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-slate-500">Anomaly Score</div>
                  <div className="text-2xl font-bold text-slate-900">{obs.anomalyScore.toFixed(3)}</div>
                  <div className='mt-2 text-xs border border-slate-300 rounded px-2 py-1 text-slate-600 inline-block'>Requires Verification</div>
                </div>
              </CardContent>
            </Card>
          ))}
          {topAnomalies.length === 0 && (
             <div className="text-center py-8 text-slate-500">No anomalies detected in historical dataset.</div>
          )}
        </div>
      </div>

    </div>
  );
}
