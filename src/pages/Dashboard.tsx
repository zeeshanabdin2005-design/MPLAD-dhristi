import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency, formatNumber } from '../lib/utils';
import { Activity, AlertTriangle, CheckCircle2, IndianRupee, MapPin, TrendingUp, FolderOpen, ArrowRight, ShieldAlert, Sparkles, Map as MapIcon, BarChart3, AlertCircle } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

const trendData = [
  { month: 'Jan', anomalies: 4, verified: 2 },
  { month: 'Feb', anomalies: 7, verified: 4 },
  { month: 'Mar', anomalies: 5, verified: 5 },
  { month: 'Apr', anomalies: 12, verified: 8 },
  { month: 'May', anomalies: 18, verified: 10 },
  { month: 'Jun', anomalies: 24, verified: 15 },
  { month: 'Jul', anomalies: 37, verified: 20 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [projects, setProjects] = React.useState<any[]>([]);
  const [highRiskProjects, setHighRiskProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { getProjects } = await import('../services/projectService');
        const { getAllRiskAssessments } = await import('../services/riskService');
        const { getTopAnomalies } = await import('../services/historicalMlService');
        const { getAllVerificationCases } = await import('../services/verificationService');
        
        const [fetchedProjects, fetchedAssessments, fetchedCases] = await Promise.all([
          getProjects(),
          getAllRiskAssessments(),
          getAllVerificationCases()
        ]);
        
        setProjects(fetchedProjects);
        
        const topAnomalies = getTopAnomalies(5);
        const priorities: any[] = [];
        const addedProjects = new Set();
        
        // 1. Critical/High Risk
        fetchedAssessments.filter(a => a.level === 'CRITICAL' || a.level === 'HIGH').forEach(a => {
          const p = fetchedProjects.find(proj => proj.id === a.projectId);
          if (p && !addedProjects.has(p.id)) {
            priorities.push({
              type: 'RULE_RISK',
              project: p,
              score: a.score,
              level: a.level,
              label: a.level + ' RISK',
              description: a.signals?.[0]?.title || 'High rule-based risk detected'
            });
            addedProjects.add(p.id);
          }
        });

        // 2. ML Anomalies
        topAnomalies.forEach(a => {
          const p = fetchedProjects.find(proj => proj.constituency === a.constituency && proj.financialYear === a.financialYear);
          if (p && !addedProjects.has(p.id)) {
            priorities.push({
              type: 'ML_ANOMALY',
              project: p,
              score: a.anomalyScore?.toFixed(2) || 'High',
              level: a.mlRiskCategory || 'HIGH',
              label: 'ML ANOMALY',
              description: 'Historical pattern anomaly detected'
            });
            addedProjects.add(p.id);
          }
        });

        // 3. Pending Document/Image Verification Cases
        fetchedCases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'PENDING').forEach(c => {
          const p = fetchedProjects.find(proj => proj.id === c.projectId);
          if (p && !addedProjects.has(p.id)) {
            priorities.push({
              type: 'PENDING_REVIEW',
              project: p,
              score: '-',
              level: 'PENDING',
              label: c.status.replace('_', ' '),
              description: 'Pending human verification review'
            });
            addedProjects.add(p.id);
          }
        });
        
        setHighRiskProjects(priorities);
      } catch (err) {
        console.error('Error fetching dashboard projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            Good Morning, {profile?.fullName || 'Officer'}
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            AI-assisted monitoring of MPLADS projects for greater transparency and impact.
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-50">
              <AlertCircle className="w-3 h-3 mr-1" />
              PROTOTYPE ENVIRONMENT • SYNTHETIC DEMONSTRATION DATA
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/reports')} variant="outline" className="border-slate-200 text-[#0F2A43]">
            <FileTextIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Projects</p>
                <p className="text-2xl font-bold text-[#0F2A43]">{formatNumber(projects.length)}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-md">
                <FolderOpen className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Allocation</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{(projects.reduce((acc, p) => acc + (p.sanctionedFunds || 0), 0) / 100000).toFixed(1)} Cr
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-md">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-[#0F2A43]">{formatNumber(projects.filter(p => p.status === 'ACTIVE').length)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 shadow-sm bg-amber-50">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Delayed</p>
                <p className="text-2xl font-bold text-amber-600">{formatNumber(projects.filter(p => p.status === 'DELAYED').length)}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-md">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 shadow-sm bg-red-50">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-700 uppercase tracking-wider">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(highRiskProjects.length)}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-md">
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#0F2A43]/20 shadow-sm bg-[#0F2A43] text-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">Pending Verify</p>
                <p className="text-2xl font-bold">{formatNumber(projects.filter(p => p.status === 'UNDER VERIFICATION').length)}</p>
              </div>
              <div className="p-2 bg-[#1E3A5F] rounded-md">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Map Preview */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm flex flex-col h-full bg-[#0B1220] border-[#1E3A5F]">
          <CardHeader className="pb-2 border-b border-[#1E3A5F]">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-emerald-400" />
              Risk Map (Madhya Pradesh)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative min-h-[300px] overflow-hidden">
             {/* Fake Map Background */}
             <div className="absolute inset-0 bg-[#0B1220] opacity-80" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
             <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="relative">
                  <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative h-4 w-4 bg-red-500 rounded-full border-2 border-[#0B1220] shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer" onClick={() => navigate('/projects/P-1042')}>
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        P-1042 (High Risk)
                     </div>
                  </div>
                </div>
                
                <div className="absolute bottom-10 left-10">
                  <div className="h-3 w-3 bg-emerald-500 rounded-full border-2 border-[#0B1220]"></div>
                </div>
                <div className="absolute top-20 right-20">
                  <div className="h-3 w-3 bg-amber-500 rounded-full border-2 border-[#0B1220]"></div>
                </div>
             </div>
             
             <Button 
               variant="outline" 
               className="absolute bottom-4 right-4 bg-[#1E3A5F]/80 border-[#1E3A5F] text-white hover:bg-[#1E3A5F] hover:text-white"
               onClick={() => navigate('/gis-intelligence')}
             >
               Open Full GIS <ArrowRight className="ml-2 h-3 w-3" />
             </Button>
          </CardContent>
        </Card>

        {/* Center: Anomaly Trends */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-[#0F2A43] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Anomaly Detection Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="anomalies" name="Anomalies Flagged" stroke="#DC2626" strokeWidth={2} fillOpacity={1} fill="url(#colorAnomalies)" />
                  <Area type="monotone" dataKey="verified" name="Verifications Completed" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right: AI Insight */}
        <Card className="lg:col-span-1 border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50 to-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-32 h-32 text-indigo-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              DRISHTI AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-indigo-700">Observation:</strong> We have detected a <span className="font-semibold text-red-600">30% spike</span> in duplicate image uploads from contractor network <span className="font-mono bg-slate-100 px-1 rounded text-xs">C-018</span> in the Bhopal district over the last 14 days.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-indigo-700">Recommendation:</strong> Review projects <strong>P-1042</strong> and <strong>P-2381</strong>. Cross-reference spatial coordinates to verify physical progress claims.
                </p>
              </div>
              
              <Button onClick={() => navigate('/risk-intelligence')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                Open Risk Intelligence <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Bottom: Investigation Priorities Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-lg font-bold text-[#0F2A43]">Investigation Priorities</CardTitle>
            <CardDescription>Projects flagged by intelligence models or pending human review</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/verification-queue')}>
            Open Queue <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Project</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Location</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Signal Source</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Description</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highRiskProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No pending priorities found.</td>
                </tr>
              ) : (
                highRiskProjects.map((item, idx) => (
                  <tr 
                    key={`${item.project.id}-${idx}`} 
                    className="transition-colors cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/projects/${item.project.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F2A43]">{item.project.id}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{item.project.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.project.district}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'RULE_RISK' && <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">RULE ENGINE</Badge>}
                        {item.type === 'ML_ANOMALY' && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">ML MODEL</Badge>}
                        {item.type === 'PENDING_REVIEW' && <Badge className="bg-amber-50 text-amber-700 border-amber-200">HUMAN REVIEW</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'RULE_RISK' && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                        {item.type === 'ML_ANOMALY' && <Activity className="h-4 w-4 text-indigo-500 shrink-0" />}
                        {item.type === 'PENDING_REVIEW' && <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />}
                        <span className="text-slate-600 text-sm font-medium truncate max-w-[250px]">
                          {item.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" className="bg-[#0F2A43] hover:bg-[#1E3A5F] text-white shadow-sm" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${item.project.id}`); }}>
                        Investigate <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Temporary internal component for missing icon
function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
