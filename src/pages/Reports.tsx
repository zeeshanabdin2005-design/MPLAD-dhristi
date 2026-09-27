import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileBox, Download, FileText, CheckCircle2 } from 'lucide-react';

export function Reports() {
  const reports = [
    { title: 'Project Risk Assessment', desc: 'Comprehensive AI risk breakdown across all active projects', type: 'PDF', date: 'Daily' },
    { title: 'Financial Anomaly Log', desc: 'Discrepancies between utilized funds and physical progress', type: 'XLSX', date: 'Weekly' },
    { title: 'Verification Compliance', desc: 'Officer response times and field inspection resolutions', type: 'PDF', date: 'Monthly' },
    { title: 'Contractor Concentration', desc: 'Network analysis of entity project clustering', type: 'CSV', date: 'On Demand' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <FileBox className="h-8 w-8 text-indigo-600" />
            Report Generation Center
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Export standard intelligence and compliance reports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg text-[#0F2A43]">{report.title}</CardTitle>
                <CardDescription>{report.desc}</CardDescription>
              </div>
              <div className="p-2 bg-slate-50 rounded text-slate-500 border border-slate-100">
                <FileText className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2 text-xs font-medium text-slate-500">
                  <span className="bg-slate-100 px-2 py-1 rounded">{report.type}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded">{report.date}</span>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="text-[#0F2A43] border-slate-200">Preview</Button>
                   <Button size="sm" className="bg-[#0F2A43] text-white hover:bg-[#1E3A5F]">
                     <Download className="h-3 w-3 mr-2" /> Generate
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-4 border-emerald-200 bg-emerald-50">
        <CardContent className="p-4 flex items-start gap-4">
           <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
           <div>
             <h4 className="font-semibold text-emerald-800">Automated Distribution</h4>
             <p className="text-sm text-emerald-700 mt-1">Monthly compliance reports are automatically generated and emailed to the District Collector on the 1st of every month.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
