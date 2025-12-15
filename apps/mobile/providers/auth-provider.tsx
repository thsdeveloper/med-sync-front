import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, lookupStaffByCrm, getCurrentStaff } from '@/lib/supabase';
import { router } from 'expo-router';
import type { MedicalStaff, CrmLookupResult } from '@medsync/shared';

type StaffData = MedicalStaff | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  staff: StaffData;
  isLoading: boolean;
  isAuthenticated: boolean;
  lookupCrm: (crm: string) => Promise<CrmLookupResult>;
  signInWithCrm: (crm: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  setupPassword: (data: SetupPasswordData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

interface SignUpData {
  name: string;
  email: string;
  phone?: string;
  crm: string;
  specialty?: string;
  password: string;
}

interface SetupPasswordData {
  staffId: string;
  crm: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffData>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStaff = useCallback(async () => {
    const staffData = await getCurrentStaff();
    setStaff(staffData);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setStaff(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await refreshStaff();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSession(null);
        setUser(null);
        setStaff(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await refreshStaff();
        } else {
          setStaff(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const lookupCrm = useCallback(async (crm: string): Promise<CrmLookupResult> => {
    return lookupStaffByCrm(crm);
  }, []);

  const signInWithCrm = useCallback(async (crm: string, password: string) => {
    try {
      // First, look up the staff member by CRM to get their auth_email
      const { data: staffData, error: lookupError } = await supabase
        .from('medical_staff')
        .select('auth_email')
        .eq('crm', crm)
        .single();

      if (lookupError || !staffData?.auth_email) {
        return { error: new Error('CRM não encontrado ou sem acesso configurado') };
      }

      // Sign in with the auth_email
      const { error } = await supabase.auth.signInWithPassword({
        email: staffData.auth_email,
        password,
      });

      if (error) {
        return { error: new Error('Senha incorreta') };
      }

      // Navigate to app
      router.replace('/(app)/(tabs)');
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      // Generate auth_email from CRM (unique identifier)
      const authEmail = `${data.crm.toLowerCase().replace(/[^a-z0-9]/g, '')}@medsync.doctor`;

      // Create auth user (with email confirmation disabled for internal auth emails)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: data.password,
        options: {
          data: {
            name: data.name,
            crm: data.crm,
          },
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('Falha ao criar usuário') };
      }

      // Sign in immediately to ensure session is active
      // (signUp may not create an active session depending on Supabase config)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: data.password,
      });

      if (signInError) {
        console.error('SignIn after signup failed:', signInError);
        return { error: signInError };
      }

      // Create medical_staff record
      const { error: staffError } = await supabase
        .from('medical_staff')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          crm: data.crm,
          specialty: data.specialty || null,
          role: 'Médico',
          color: generateRandomColor(),
          active: true,
          user_id: authData.user.id,
          auth_email: authEmail,
        });

      if (staffError) {
        // Rollback: sign out and try to clean up
        await supabase.auth.signOut();
        return { error: staffError };
      }

      // Refresh staff data after insert
      await refreshStaff();

      // Navigate to app
      router.replace('/(app)/(tabs)');
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [refreshStaff]);

  const setupPassword = useCallback(async (data: SetupPasswordData) => {
    try {
      // Generate auth_email from CRM
      const authEmail = `${data.crm.toLowerCase().replace(/[^a-z0-9]/g, '')}@medsync.doctor`;
      console.log('Setup password for CRM:', data.crm, 'authEmail:', authEmail);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: data.password,
      });

      console.log('SignUp result:', { user: authData?.user?.id, error: authError });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('Falha ao criar usuário') };
      }

      // Sign in immediately to ensure session is active
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: data.password,
      });

      if (signInError) {
        console.error('SignIn after signup failed:', signInError);
        return { error: signInError };
      }

      console.log('Updating medical_staff:', data.staffId, 'with user_id:', authData.user.id);

      // Update medical_staff record with user_id and auth_email
      const { error: updateError } = await supabase
        .from('medical_staff')
        .update({
          user_id: authData.user.id,
          auth_email: authEmail,
          email: data.email, // Update contact email too
        })
        .eq('id', data.staffId);

      if (updateError) {
        console.error('Update medical_staff failed:', updateError);
        return { error: updateError };
      }

      console.log('Setup password completed successfully');

      // Refresh staff data after update (important: the onAuthStateChange
      // refreshStaff ran before the update, so staff is still null)
      await refreshStaff();

      // Navigate to app
      router.replace('/(app)/(tabs)');
      return { error: null };
    } catch (err) {
      console.error('Setup password error:', err);
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStaff(null);
    // Navegação é feita automaticamente pelo Redirect em (app)/_layout.tsx
  }, []);

  const value: AuthContextType = {
    user,
    session,
    staff,
    isLoading,
    isAuthenticated: !!session && !!user,
    lookupCrm,
    signInWithCrm,
    signUp,
    setupPassword,
    signOut,
    refreshStaff,
  };

  return (
    <AuthContext.Provider value={value}>
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

// Helper function to generate random color for staff
function generateRandomColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
