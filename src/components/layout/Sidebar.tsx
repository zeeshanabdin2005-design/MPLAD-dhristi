import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ShieldAlert,
  Activity,
  Map, 
  FileText, 
  Image as ImageIcon, 
  BarChart3, 
  Network, 
  CheckCircle, 
  History, 
  FileBox,
  Settings,
  LogOut,
  BrainCircuit
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', to: '/projects', icon: FolderKanban },
  { name: 'Risk Intelligence', to: '/risk-intelligence', icon: ShieldAlert },
  { name: 'GIS Intelligence', to: '/gis-intelligence', icon: Map },
  { name: 'Document Intelligence', to: '/document-intelligence', icon: FileText },
  { name: 'Image Intelligence', to: '/image-intelligence', icon: ImageIcon },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Contractor Network', to: '/contractor-network', icon: Network },
  { name: 'Contractor Updates', to: '/contractor-updates', icon: Activity },
  { name: 'Verification Queue', to: '/verification-queue', icon: CheckCircle },
  { name: 'Audit Logs', to: '/audit-logs', icon: History },
  { name: 'Reports', to: '/reports', icon: FileBox },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  
  return (
    <div className="flex h-full w-72 flex-col bg-[#0F2A43] border-r border-[#0B1220]">
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-[#1E3A5F]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight tracking-tight text-white">MPLADS-DRISHTI</span>
            <span className="text-[10px] text-blue-300 font-semibold tracking-wider uppercase">AI FOR ACCOUNTABLE DEV</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-[#1E3A5F] scrollbar-track-transparent">
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg",
                  isActive
                    ? "bg-[#1E3A5F] text-white shadow-sm"
                    : "text-slate-400 hover:bg-[#1E3A5F]/50 hover:text-slate-200"
                )
              }
            >
              <item.icon className={cn("h-4 w-4 shrink-0", 
                // Add subtle semantic colors to specific icons if desired, or keep uniform
                item.name === 'Risk Intelligence' ? 'text-red-400' :
                item.name === 'GIS Intelligence' ? 'text-emerald-400' :
                item.name.includes('Intelligence') ? 'text-blue-400' : ''
              )} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="shrink-0 p-4 border-t border-[#1E3A5F]">
        {/* AI Assistant Banner */}
        <div className="mb-4 rounded-lg bg-gradient-to-br from-[#1E3A5F] to-[#0B1220] p-3 border border-[#1E3A5F] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <BrainCircuit className="h-12 w-12 text-white" />
          </div>
          <div className="relative z-10 flex items-start gap-3">
             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <BrainCircuit className="h-4 w-4 text-indigo-400" />
             </div>
             <div>
                <p className="text-sm font-medium text-white">DRISHTI AI</p>
                <p className="text-[10px] text-indigo-200 mt-0.5 leading-tight">Ask questions, get insights.</p>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3 border border-[#1E3A5F]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 shrink-0">
              <span className="text-xs font-semibold text-white">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'O')}
              </span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate">{profile?.fullName || user?.email || 'Officer'}</span>
              <span className="text-[10px] text-slate-400">{profile?.designation || 'District Officer'}</span>
              <span className="text-[10px] text-slate-400">{profile?.location || 'Bhopal'}</span>
            </div>
          </div>
          <button onClick={signOut} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-[#1E3A5F]" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">Government of India</p>
        </div>
      </div>
    </div>
  );
}
