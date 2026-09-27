import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldAlert, IndianRupee, MailCheck } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { user, refreshUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [location, setLocation] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // If already logged in and verified, redirect
  React.useEffect(() => {
    if (user && user.emailVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAuth = async () => {
    setError(null);
    setMsg(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName || !designation || !location) {
          setError('Full Name, Designation, and Location are required.');
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          fullName,
          designation,
          location,
          email,
          role: 'OFFICER',
          createdAt: new Date().toISOString()
        });
        await sendEmailVerification(cred.user);
        setMsg('Account created. Please check your email to verify your account.');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profileSnap = await getDoc(doc(db, 'users', cred.user.uid));
        const profileData = profileSnap.exists() ? profileSnap.data() : null;
        if (profileData?.role === 'CONTRACTOR') {
          await signOut();
          throw new Error('This is a contractor account. Please use Contractor Login.');
        }
        await reload(cred.user);

        if (cred.user.emailVerified) {
          navigate('/dashboard');
        } else {
          setError('Email not verified. Please check your inbox, then use “I’ve Verified My Email”.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    setError(null);
    setMsg(null);
    setLoading(true);

    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser?.emailVerified) {
        setMsg('Email verified successfully. Redirecting…');
        navigate('/dashboard');
      } else {
        setError('Firebase still reports this email as unverified. Open the latest verification email, complete verification, then try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not refresh your verification status.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError(null);
    setMsg(null);
    setLoading(true);

    try {
      const refreshedUser = await refreshUser();
      if (!refreshedUser) {
        setError('Your session has expired. Please sign in again.');
        return;
      }

      if (refreshedUser.emailVerified) {
        setMsg('Your email is already verified. Redirecting…');
        navigate('/dashboard');
        return;
      }

      await sendEmailVerification(refreshedUser);
      setMsg('Verification email sent. Check your inbox and spam/junk folder.');
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/too-many-requests') {
        setError('Too many verification emails were requested. Please wait before requesting another email.');
      } else {
        setError(err?.message || 'Could not send the verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md p-6 text-center space-y-4">
          <MailCheck className="w-12 h-12 text-blue-500 mx-auto" />
          <h2 className="text-xl font-bold">Verify Your Email</h2>
          <p className="text-slate-500">
            We've sent a verification link to <span className="font-medium text-slate-700">{user.email}</span>.
            Please complete verification before accessing the system.
          </p>

          {error && <div className="text-xs text-red-500">{error}</div>}
          {msg && <div className="text-xs text-emerald-600">{msg}</div>}

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
            <Button onClick={resendVerification} variant="outline" disabled={loading}>
              {loading ? 'Processing…' : 'Resend Email'}
            </Button>
            <Button onClick={checkVerification} disabled={loading}>
              {loading ? 'Checking…' : "I've Verified My Email"}
            </Button>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
          >
            Use a different account
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <Card className="w-full max-w-md relative z-10 border-slate-200 shadow-xl bg-white/80 backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center pt-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
             <IndianRupee className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">MPLADS-DRISHTI</CardTitle>
          <CardDescription className="text-slate-500">
            AI-Driven Anomaly Detection & Risk Intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8 px-8">
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name" 
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Designation</label>
                  <input 
                    type="text" 
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. District Officer" 
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Bhopal, Madhya Pradesh" 
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Official Email / ID</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@drishti.gov.in" 
                className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          
          {error && <div className="text-xs text-red-500">{error}</div>}
          {msg && <div className="text-xs text-emerald-600">{msg}</div>}

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-3">
             <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
             <div className="text-xs text-amber-700 leading-relaxed">
               <span className="font-semibold block mb-1">Restricted Access</span>
               Authorized personnel only. Email verification is required.
             </div>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? "Processing..." : isSignUp ? "Register Account" : "Secure Login"}
          </Button>
          
          <div className="text-center space-y-2">
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-blue-600 hover:underline">
              {isSignUp ? "Already have an account? Log in" : "Need access? Register"}
            </button>
            <button type="button" onClick={() => navigate('/contractor-login')} className="block w-full text-xs text-indigo-600 hover:underline">
              Contractor Login →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
