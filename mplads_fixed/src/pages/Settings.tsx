import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Settings as SettingsIcon, User, Shield, Bell, CheckCircle2, UploadCloud, Loader2, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { importCsvData } from '../services/importService';
import { getProjects } from '../services/projectService';
import { batchCalculateAndPersistRisk } from '../services/riskService';

export function Settings() {
  const { user, profile } = useAuth();
  
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ historical?: number, mlReady?: number, analyzed?: number } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'historical' | 'ml_ready') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const count = await importCsvData(file, type);
      setImportResult(prev => ({ ...prev, [type === 'historical' ? 'historical' : 'mlReady']: count }));
      alert(`Successfully imported ${count} records from ${file.name}`);
    } catch (err) {
      console.error('Import failed', err);
      alert(`Import failed: ${err?.message || 'Check console for details.'}`);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleRunRiskEngine = async () => {
    try {
      setImporting(true);
      const allProjects = await getProjects();
      if (allProjects.length === 0) {
        alert("No projects found to analyze. Please import data first.");
        return;
      }
      const assessments = await batchCalculateAndPersistRisk(allProjects);
      setImportResult(prev => ({ ...prev, analyzed: assessments.length }));
      alert(`Successfully analyzed ${assessments.length} projects.`);
    } catch (err) {
      console.error('Risk engine failed', err);
      alert(`Risk engine calculation failed: ${err?.message || 'Check console.'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8 h-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2A43] mb-2 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-slate-700" />
            System Settings
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Manage your profile, preferences, and system access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
           <Button variant="ghost" className="w-full justify-start bg-slate-100 text-[#0F2A43] font-semibold"><User className="mr-2 h-4 w-4" /> Profile & Account</Button>
           <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900"><Shield className="mr-2 h-4 w-4" /> Security & Access</Button>
           <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900"><Bell className="mr-2 h-4 w-4" /> Notifications</Button>
           <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900"><UploadCloud className="mr-2 h-4 w-4" /> Data Management</Button>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0F2A43]">Data Import & Processing</CardTitle>
              <CardDescription>Upload MPLADS CSV Datasets and run the Risk Intelligence Engine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800">Historical Records (mplads_historical_clean.csv)</h3>
                    <p className="text-xs text-slate-500">Upload the base records for all projects.</p>
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'historical')}
                      disabled={importing}
                    />
                    <Button disabled={importing} variant="outline" size="sm" className="pointer-events-none">
                      {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                      Upload CSV
                    </Button>
                  </div>
                </div>
                {importResult?.historical !== undefined && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Imported {importResult.historical} historical records</p>
                )}
                
                <div className="border-t border-slate-200 pt-4 mt-4"></div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800">ML-Ready Data (ml_ready_data.csv)</h3>
                    <p className="text-xs text-slate-500">Upload records with pre-computed risk scores.</p>
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'ml_ready')}
                      disabled={importing}
                    />
                    <Button disabled={importing} variant="outline" size="sm" className="pointer-events-none">
                      {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                      Upload CSV
                    </Button>
                  </div>
                </div>
                {importResult?.mlReady !== undefined && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Imported {importResult.mlReady} ML records</p>
                )}

                <div className="border-t border-slate-200 pt-4 mt-4"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800">Risk Intelligence Engine</h3>
                    <p className="text-xs text-slate-500">Batch calculate risk metrics for all imported projects.</p>
                  </div>
                  <Button disabled={importing} variant="default" size="sm" onClick={handleRunRiskEngine} className="bg-[#0F2A43] hover:bg-[#1E3A5F]">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                    Run Risk Engine
                  </Button>
                </div>
                {importResult?.analyzed !== undefined && (
                  <p className="text-xs text-blue-600 font-medium">✓ Analyzed {importResult.analyzed} projects successfully</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0F2A43]">Officer Profile</CardTitle>
              <CardDescription>Your registered identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                   <span className="text-2xl font-bold text-blue-700">{profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'O')}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{profile?.fullName || user?.email || 'Officer'}</h3>
                  <p className="text-sm text-slate-500">{profile?.designation || 'District Officer'}, {profile?.location || 'Bhopal'}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-max border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Identity Verified
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Email Address</label>
                  <input type="text" disabled value={user?.email || ''} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Role</label>
                  <input type="text" disabled value="Verification Officer" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
