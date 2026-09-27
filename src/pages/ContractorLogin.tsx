import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShieldCheck, HardHat, MailCheck } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export function ContractorLogin() {
  const navigate = useNavigate();
  const { user, profile, refreshUser, signOut } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.emailVerified && profile?.role === 'CONTRACTOR') navigate('/contractor', { replace: true });
    if (user?.emailVerified && profile && profile.role !== 'CONTRACTOR') {
      setError('This account is registered as an officer account. Please use Officer Login.');
    }
  }, [user, profile, navigate]);

  const submit = async () => {
    setError(null); setMessage(null); setLoading(true);
    try {
      if (!email || !password) throw new Error('Email and password are required.');
      if (isSignUp) {
        if (!fullName || !company || !location) throw new Error('Name, contractor/company name, and location are required.');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          fullName,
          designation: 'Registered Contractor',
          location,
          email,
          role: 'CONTRACTOR',
          contractorCompany: company,
          phone,
          createdAt: new Date().toISOString(),
        });
        await sendEmailVerification(cred.user);
        setMessage('Contractor account created. Verify your email before entering the contractor portal.');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profileSnap = await import('firebase/firestore').then(m => m.getDoc(doc(db, 'users', cred.user.uid)));
        const data = profileSnap.exists() ? profileSnap.data() : null;
        if (data?.role !== 'CONTRACTOR') {
          await signOut();
          throw new Error('This is not a contractor account. Use Officer Login for this account.');
        }
        await refreshUser();
        if (!cred.user.emailVerified) {
          setError('Email not verified. Check your inbox, then verify before continuing.');
        } else {
          navigate('/contractor');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Contractor authentication failed.');
    } finally { setLoading(false); }
  };

  const checkVerification = async () => {
    setLoading(true); setError(null); setMessage(null);
    try {
      const refreshed = await refreshUser();
      if (refreshed?.emailVerified) navigate('/contractor');
      else setError('Email is still unverified. Open the latest verification email and try again.');
    } catch (err: any) { setError(err?.message || 'Could not refresh verification status.'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setLoading(true); setError(null); setMessage(null);
    try {
      if (!auth.currentUser) throw new Error('Please sign in again.');
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) { navigate('/contractor'); return; }
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification email sent. Check inbox and spam/junk.');
    } catch (err: any) { setError(err?.code === 'auth/too-many-requests' ? 'Too many requests. Please wait before resending.' : (err?.message || 'Unable to resend verification email.')); }
    finally { setLoading(false); }
  };

  if (user && !user.emailVerified) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <MailCheck className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Verify Contractor Email</h2>
        <p className="text-sm text-slate-500 mt-2">Verification link sent to <b>{user.email}</b>. Access is enabled only after Firebase confirms verification.</p>
        {error && <p className="text-xs text-red-600 mt-4">{error}</p>}
        {message && <p className="text-xs text-emerald-600 mt-4">{message}</p>}
        <div className="grid grid-cols-2 gap-2 mt-6">
          <Button variant="outline" disabled={loading} onClick={resend}>{loading ? 'Processing…' : 'Resend Email'}</Button>
          <Button disabled={loading} onClick={checkVerification}>{loading ? 'Checking…' : 'I’ve Verified'}</Button>
        </div>
        <button className="text-xs text-slate-500 hover:underline mt-4" onClick={signOut}>Use different account</button>
      </Card>
    </div>;
  }

  return <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    <Card className="w-full max-w-md relative z-10 border-slate-200 shadow-xl bg-white/90 backdrop-blur-xl">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><HardHat className="h-6 w-6 text-white" /></div>
        <CardTitle className="text-2xl font-bold text-slate-900 mt-3">MPLADS-DRISHTI</CardTitle>
        <CardDescription>Contractor Progress Portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-8 px-8">
        {isSignUp && <>
          <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Site / authorized representative" />
          <Field label="Contractor / Company Name" value={company} onChange={setCompany} placeholder="ABC Infrastructure Pvt. Ltd." />
          <Field label="Phone (optional)" value={phone} onChange={setPhone} placeholder="Contact number" />
          <Field label="Location" value={location} onChange={setLocation} placeholder="District, State" />
        </>}
        <Field label="Email" value={email} onChange={setEmail} placeholder="contractor@example.com" type="email" />
        <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••••••" type="password" />
        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
        {message && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">{message}</div>}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-3"><ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" /><p className="text-xs text-indigo-800"><b>Contractor workspace:</b> request project access, submit weekly progress, attach site evidence, and maintain a dated submission trail.</p></div>
        <Button className="w-full bg-[#0F2A43] hover:bg-[#1E3A5F] text-white h-11" disabled={loading} onClick={submit}>{loading ? 'Processing…' : isSignUp ? 'Register Contractor' : 'Contractor Login'}</Button>
        <button className="w-full text-xs text-blue-600 hover:underline" onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}>{isSignUp ? 'Already registered? Contractor Login' : 'New contractor? Register'}</button>
        <button className="w-full text-xs text-slate-500 hover:text-slate-800 hover:underline" onClick={() => navigate('/login')}>Officer Login →</button>
      </CardContent>
    </Card>
  </div>;
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return <div className="space-y-2"><label className="text-sm font-medium text-slate-700">{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>;
}
