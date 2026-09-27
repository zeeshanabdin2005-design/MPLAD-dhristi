import React from 'react';
import { Search, Bell, Activity, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  
  // Basic route to title mapping
  const path = location.pathname.split('/')[1] || 'dashboard';
  const title = path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <button className="md:hidden text-slate-500 hover:text-slate-900">
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden text-sm font-medium text-slate-400 md:block">
          <span className="text-slate-400">MPLADS-DRISHTI</span> / <span className="text-slate-900">{title}</span>
        </div>
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search project, district, contractor, alert..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Activity className="h-3.5 w-3.5" />
          System Operational
        </div>
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_2px_#fff]"></span>
        </button>
      </div>
    </header>
  );
}
