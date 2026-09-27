import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { getProjects } from '../services/projectService';
import { MpladsProject } from '../types';
import { formatCurrency } from '../lib/utils';
import { Search, Filter, Download, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MpladsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Fetch strictly from Firestore
        let data = await getProjects();
        setProjects(data);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError('Unable to load project data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2">Projects Directory</h1>
            <p className="text-slate-500 font-medium">Comprehensive view of all monitored projects.</p>
          </div>
        </div>
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-slate-200 shadow-sm">
           <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
           <p className="text-slate-500 font-medium">Loading project intelligence...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2">Projects Directory</h1>
            <p className="text-slate-500 font-medium">Comprehensive view of all monitored projects.</p>
          </div>
        </div>
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-slate-200 shadow-sm">
           <div className="text-red-500 mb-2">Error</div>
           <p className="text-slate-500 font-medium">{error}</p>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2">Projects Directory</h1>
          <p className="text-slate-500 font-medium">Comprehensive view of all monitored projects.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="border-slate-200 text-[#0F2A43]">
             <Filter className="mr-2 h-4 w-4" /> Filters
           </Button>
           <Button variant="outline" className="border-slate-200 text-[#0F2A43]">
             <Download className="mr-2 h-4 w-4" /> Export CSV
           </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-4">
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search projects..."
                  className="w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Project ID</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Location</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Allocation</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Risk Score</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                  <td className="px-6 py-4 font-bold text-[#0F2A43] whitespace-nowrap">{project.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 truncate max-w-[250px]">{project.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{project.category}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {project.district}, {project.state}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {formatCurrency(project.sanctionedFunds || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`font-bold ${(project.riskScore || 0) > 75 ? 'text-red-600' : (project.riskScore || 0) > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                         {project.riskScore}
                       </span>
                       <Badge 
                         variant={project.riskLevel === 'HIGH' || project.riskLevel === 'CRITICAL' ? 'destructive' : 'outline'} 
                         className={project.riskLevel === 'MEDIUM' ? 'text-amber-600 border-amber-300 bg-amber-50' : project.riskLevel === 'LOW' ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : 'bg-red-500'}
                       >
                         {project.riskLevel}
                       </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}>
                      View <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
