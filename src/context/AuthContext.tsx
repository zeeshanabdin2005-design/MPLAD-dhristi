import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  reload,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserProfile {
  fullName: string;
  designation: string;
  location: string;
  role?: 'OFFICER' | 'CONTRACTOR';
  contractorCompany?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      setProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
    } catch (e: any) {
      console.error('Error fetching user profile:', e?.message || e);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await loadProfile(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Firebase does not automatically refresh emailVerified in the existing
   * client-side User object after the user clicks the verification link.
   * reload() fetches the current account state from Firebase Auth.
   */
  const refreshUser = async (): Promise<User | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      return null;
    }

    await reload(currentUser);
    const refreshedUser = auth.currentUser;
    setUser(refreshedUser);
    await loadProfile(refreshedUser);
    return refreshedUser;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, refreshUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
