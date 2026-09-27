import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { History, Search, Download, Filter } from 'lucide-react';



export function AuditLogs() {

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <History className="h-8 w-8 text-slate-700" />
            Audit Logs & Compliance
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Immutable record of all system state changes, AI inferences, and human verifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="border-slate-200 text-[#0F2A43]">
             <Download className="mr-2 h-4 w-4" /> Export Logs
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
                  placeholder="Search by ID, User, or Project..."
                  className="w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
             </div>
             <Button variant="outline" size="sm" className="hidden sm:flex bg-white text-slate-700 border-slate-200">
               <Filter className="mr-2 h-4 w-4" /> Filter
             </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Fetching immutable ledger...</p>
            </div>
          ) : (
          <table className="w-full text-sm text-left">

            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-semibold tracking-wider">User / Agent</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Action</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Target</th>
                <th className="px-6 py-4 font-semibold tracking-wider">State Change</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Reason / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[13px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-semibold ${log.actor.includes('System') ? 'text-indigo-600' : 'text-slate-800'}`}>{log.actor}</div>
                    <div className="text-xs text-slate-500 font-sans">{log.actor.includes('DRISHTI_AI') ? 'AI Agent' : 'System User'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">{log.action}</Badge>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600 cursor-pointer hover:underline">
                    {log.projectId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                       <span className="text-slate-500">{log.metadata?.status ? 'STATE UPDATE' : 'EVENT'}</span>
                       <span className="text-slate-300">→</span>
                       <span className="font-semibold text-slate-800">{log.metadata?.status || log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-[300px] truncate font-sans text-xs">
                    {log.metadata ? JSON.stringify(log.metadata) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
