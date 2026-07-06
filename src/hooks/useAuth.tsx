import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { HospitalUser, HospitalRole } from '../types';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  hospitalUser: HospitalUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: HospitalRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  hasRole: (roles: HospitalRole[]) => boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isReceptionist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hospitalUser, setHospitalUser] = useState<HospitalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHospitalUser(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchHospitalUser(session.user.email!);
      } else {
        setHospitalUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHospitalUser = async (email: string) => {
    const { data, error } = await supabase
      .from('hospital_users')
      .select('*, departments(name)')
      .eq('email', email)
      .maybeSingle();

    if (data && !error) {
      setHospitalUser(data as unknown as HospitalUser);
      // Update last login
      await supabase
        .from('hospital_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: HospitalRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: { full_name: fullName, role }
      }
    });

    if (!error && data.user) {
      // Create hospital user record
      const { error: profileError } = await supabase
        .from('hospital_users')
        .insert({
          auth_user_id: data.user.id,
          email,
          full_name: fullName,
          role,
          status: 'active'
        });

      if (profileError) {
        return { error: new Error(profileError.message) };
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setHospitalUser(null);
  };

  const continueAsGuest = async () => {
    // Fetch the demo hospital user
    const { data, error } = await supabase
      .from('hospital_users')
      .select('*, departments(name)')
      .eq('email', 'admin@hospital.com')
      .maybeSingle();

    if (data && !error) {
      setHospitalUser({
        ...data,
        role: data.role as HospitalRole,
      } as HospitalUser);
    } else {
      // Create a mock guest user if no demo user exists
      setHospitalUser({
        id: 'guest-user',
        email: 'guest@hospital.com',
        full_name: 'Guest User',
        role: 'admin' as HospitalRole,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as HospitalUser);
    }
  };

  const hasRole = (roles: HospitalRole[]) => {
    if (!hospitalUser) return false;
    return roles.includes(hospitalUser.role);
  };

  const isAdmin = hospitalUser?.role === 'admin';
  const isDoctor = hospitalUser?.role === 'doctor';
  const isReceptionist = hospitalUser?.role === 'receptionist';

  return (
    <AuthContext.Provider value={{
      session,
      user,
      hospitalUser,
      loading,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      hasRole,
      isAdmin,
      isDoctor,
      isReceptionist
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
