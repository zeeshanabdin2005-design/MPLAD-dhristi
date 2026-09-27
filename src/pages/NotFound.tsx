import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 max-w-md mb-8">
        The requested module or page could not be found. It may be under construction or you might not have the required permissions to view it.
      </p>
      <Button onClick={() => navigate('/dashboard')} className="bg-[#0F2A43] hover:bg-[#1E3A5F] text-white">
        <ArrowLeft className="h-4 w-4 mr-2" /> Return to Dashboard
      </Button>
    </div>
  );
}