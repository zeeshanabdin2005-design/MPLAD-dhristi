import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { ImageIntelligence } from './pages/ImageIntelligence';
import { GisIntelligence } from './pages/GisIntelligence';
import { DocumentIntelligence } from './pages/DocumentIntelligence';
import { RiskIntelligence } from './pages/RiskIntelligence';
import { Analytics } from './pages/Analytics';
import { ContractorNetwork } from './pages/ContractorNetwork';
import { VerificationQueue } from './pages/VerificationQueue';
import { AuditLogs } from './pages/AuditLogs';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { Login } from './pages/Login';
import { ContractorLogin } from './pages/ContractorLogin';
import { ContractorDashboard } from './pages/ContractorDashboard';
import { ContractorUpdates } from './pages/ContractorUpdates';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Authenticating...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Do not allow an authenticated-but-unverified Firebase user into the app.
  // Login.tsx provides the verification screen and refresh action.
  if (!user.emailVerified) {
    return <Navigate to="/login" replace />;
  }
  if (profile?.role === 'CONTRACTOR') {
    return <Navigate to="/contractor" replace />;
  }
  return <>{children}</>;
}

function ContractorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Authenticating contractor portal...</div>;
  if (!user) return <Navigate to="/contractor-login" replace />;
  if (!user.emailVerified) return <Navigate to="/contractor-login" replace />;
  if (profile?.role !== 'CONTRACTOR') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/contractor-login" element={<ContractorLogin />} />
          <Route path="/contractor" element={<ContractorProtectedRoute><ContractorDashboard /></ContractorProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="risk-intelligence" element={<RiskIntelligence />} />
            <Route path="gis-intelligence" element={<GisIntelligence />} />
            <Route path="document-intelligence" element={<DocumentIntelligence />} />
            <Route path="image-intelligence" element={<ImageIntelligence />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="contractor-network" element={<ContractorNetwork />} />
            <Route path="contractor-updates" element={<ContractorUpdates />} />
            <Route path="verification-queue" element={<VerificationQueue />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            
            {/* Catch-all for unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
