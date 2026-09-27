import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getProjects } from '../services/projectService';
import { MpladsProject } from '../types';
import { BarChart3, Download, Filter, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function Analytics() {
  const [projects, setProjects] = useState<MpladsProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const progressData = React.useMemo(() => {
    if (!projects.length) return [];
    
    // Group by district (or state if district not available)
    const grouped = projects.reduce((acc, p) => {
      const key = p.district || p.state || 'Unknown';
      if (!acc[key]) {
        acc[key] = { financial: 0, physical: 0, count: 0 };
      }
      acc[key].financial += p.pctUtilisation || 0;
      acc[key].physical += p.pctCompleted || 0;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { financial: number, physical: number, count: number }>);
    
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      financial: Math.round(data.financial / data.count),
      physical: Math.round(data.physical / data.count),
    })).slice(0, 5); // top 5
  }, [projects]);

  const riskDistribution = React.useMemo(() => {
    const low = projects.filter(p => p.riskLevel === 'LOW').length;
    const medium = projects.filter(p => p.riskLevel === 'MEDIUM').length;
    const high = projects.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    
    return [
      { name: 'Low Risk', value: low || 1, color: '#10B981' },
      { name: 'Medium Risk', value: medium || 1, color: '#F59E0B' },
      { name: 'High Risk', value: high || 1, color: '#EF4444' },
    ];
  }, [projects]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Analytics Workspace
            </h1>
          </div>
        </div>
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-slate-200 shadow-sm">
           <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
           <p className="text-slate-500 font-medium">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Analytics Workspace
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            State-wide project performance, financial utilization, and anomaly trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="border-slate-200 text-[#0F2A43]">
             <Filter className="mr-2 h-4 w-4" /> Time Period
           </Button>
           <Button variant="outline" className="border-slate-200 text-[#0F2A43]">
             <Download className="mr-2 h-4 w-4" /> Export Report
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Financial vs Physical Progress (District-wise)</CardTitle>
            <CardDescription>Average utilization % vs reported physical completion %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="financial" name="Financial Progress %" fill="#0F2A43" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="physical" name="Physical Progress %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Overall Risk Distribution</CardTitle>
            <CardDescription>Current snapshot of project risk categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Projects`, 'Count']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
