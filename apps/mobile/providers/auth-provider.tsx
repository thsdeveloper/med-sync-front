import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, lookupStaffByCrm, lookupStaffByRegistro, lookupStaffByCpf, getCurrentStaff, clearAuthStorage } from '@/lib/supabase';
import { router } from 'expo-router';
import type { MedicalStaff, CrmLookupResult, RegistroLookupResult, CpfLookupResult } from '@medsync/shared';
import { generateAuthEmail, normalizeCpf } from '@medsync/shared';

type StaffData = MedicalStaff | null;

// Loading state for better UX feedback
export type AuthLoadingState =
  | 'initializing'    // Verificando sessão local
  | 'connecting'      // Conectando ao Supabase
  | 'ready'           // Pronto para usar
  | 'error';          // Erro (com opção de retry)

interface AuthContextType {
  user: User | null;
  session: Session | null;
  staff: StaffData;
  isLoading: boolean;
  loadingState: AuthLoadingState;
  loadingMessage: string;
  authError: Error | null;
  retryAuth: () => Promise<void>;
  isAuthenticated: boolean;
  // Legacy CRM methods (deprecated - kept for backward compatibility)
  /** @deprecated Use lookupCpf instead */
  lookupCrm: (crm: string) => Promise<CrmLookupResult>;
  /** @deprecated Use signInWithCpf instead */
  signInWithCrm: (crm: string, password: string) => Promise<{ error: Error | null }>;
  // Registro profissional methods (deprecated - use CPF methods)
  /** @deprecated Use lookupCpf instead */
  lookupRegistro: (numero: string, uf: string) => Promise<RegistroLookupResult>;
  /** @deprecated Use signInWithCpf instead */
  signInWithRegistro: (conselhoSigla: string, numero: string, uf: string, password: string) => Promise<{ error: Error | null }>;
  /** @deprecated Use signUpWithCpf instead */
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  /** @deprecated Use setupPasswordWithCpf instead */
  setupPassword: (data: SetupPasswordData) => Promise<{ error: Error | null }>;
  // NEW: CPF-based methods (preferred)
  lookupCpf: (cpf: string) => Promise<CpfLookupResult>;
  signInWithCpf: (cpf: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithCpf: (data: SignUpWithCpfData) => Promise<{ error: Error | null }>;
  setupPasswordWithCpf: (data: SetupPasswordWithCpfData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

interface SignUpData {
  name: string;
  email: string;
  phone?: string;
  /** @deprecated Use profissao_id + registro fields instead */
  crm?: string;
  // New registro profissional fields
  profissao_id: string;
  registro_numero: string;
  registro_uf: string;
  registro_categoria?: string;
  conselhoSigla: string; // Para gerar auth_email
  /**
   * Foreign key to especialidades table (REQUIRED).
   * References the medical specialty from the normalized especialidades catalog.
   */
  especialidade_id: string;
  password: string;
}

interface SetupPasswordData {
  staffId: string;
  /** @deprecated Use registro fields instead */
  crm?: string;
  // New registro profissional fields
  conselhoSigla: string;
  registro_numero: string;
  registro_uf: string;
  email: string;
  password: string;
}

// NEW: CPF-based signup data
interface SignUpWithCpfData {
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  // Professional registration (still collected)
  profissao_id: string;
  registro_numero: string;
  registro_uf: string;
  registro_categoria?: string;
  especialidade_id: string;
  password: string;
}

// NEW: CPF-based setup password data
interface SetupPasswordWithCpfData {
  staffId: string;
  cpf: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout - increased to account for storage retries
const SESSION_TIMEOUT_MS = 25000; // 25s to allow storage retries
const MAX_AUTH_RETRIES = 2;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AuthProvider] Component rendering...');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffData>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<AuthLoadingState>('initializing');
  const [loadingMessage, setLoadingMessage] = useState('Verificando sessão...');
  const [authError, setAuthError] = useState<Error | null>(null);

  // Track if initialization is in progress to prevent race conditions with listener
  const isInitializingRef = React.useRef(true);
  const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null);

  const refreshStaff = useCallback(async () => {
    const staffData = await getCurrentStaff();
    setStaff(staffData);
  }, []);

  // Retry function for getSession with exponential backoff
  const getSessionWithRetry = useCallback(async (retries: number = MAX_AUTH_RETRIES): Promise<{
    session: Session | null;
    error: Error | null;
  }> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[Auth] getSession attempt ${attempt + 1}/${retries + 1}...`);

        if (attempt > 0) {
          setLoadingMessage(`Tentando novamente (${attempt + 1}/${retries + 1})...`);
        }

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(new Error('Session check timeout'));
          }, SESSION_TIMEOUT_MS)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) {
          throw error;
        }

        return { session, error: null };
      } catch (error) {
        console.warn(`[Auth] getSession attempt ${attempt + 1} failed:`, error);

        if (attempt < retries) {
          // Wait before retrying with exponential backoff
          const delay = 1000 * Math.pow(2, attempt);
          console.log(`[Auth] Waiting ${delay}ms before retry...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          // All retries exhausted
          return { session: null, error: error as Error };
        }
      }
    }

    return { session: null, error: new Error('Max retries exceeded') };
  }, []);

  // Main initialization function
  const initializeAuth = useCallback(async () => {
    try {
      console.log('[Auth] Starting initializeAuth...');
      isInitializingRef.current = true;
      setAuthError(null);
      setLoadingState('initializing');
      setLoadingMessage('Verificando sessão...');

      // Get session with retry
      setLoadingState('connecting');
      setLoadingMessage('Conectando...');

      const { session, error } = await getSessionWithRetry();

      if (error) {
        console.error('[Auth] Error getting session after retries:', error);

        // Clear potentially corrupted session data
        console.log('[Auth] Clearing stale session data...');
        try {
          await clearAuthStorage();
          console.log('[Auth] Session storage cleared successfully');
        } catch (clearError) {
          console.warn('[Auth] Error clearing session storage:', clearError);
        }

        setSession(null);
        setUser(null);
        setStaff(null);
        setAuthError(error);
        setLoadingState('error');
        setLoadingMessage('Erro ao verificar sessão');
        return;
      }

      console.log('[Auth] Session retrieved:', session ? 'active' : 'none');

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoadingMessage('Carregando dados...');
        await refreshStaff();
      }

      setLoadingState('ready');
      setLoadingMessage('');
      setAuthError(null);
    } catch (error) {
      console.error('[Auth] Initialization error:', error);
      setSession(null);
      setUser(null);
      setStaff(null);
      setAuthError(error as Error);
      setLoadingState('error');
      setLoadingMessage('Erro inesperado');
    } finally {
      isInitializingRef.current = false;
      setIsLoading(false);
    }
  }, [getSessionWithRetry, refreshStaff]);

  // Retry auth function exposed to context
  const retryAuth = useCallback(async () => {
    setIsLoading(true);
    await initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Start initialization
    initializeAuth();

    // Set up auth state listener
    // We register it immediately but ignore events during initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] onAuthStateChange:', event, 'isInitializing:', isInitializingRef.current);

        // Skip events during initialization to prevent race conditions
        if (isInitializingRef.current) {
          console.log('[Auth] Ignoring auth event during initialization');
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await refreshStaff();
        } else {
          setStaff(null);
        }
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [initializeAuth, refreshStaff]);

  const lookupCrm = useCallback(async (crm: string): Promise<CrmLookupResult> => {
    return lookupStaffByCrm(crm);
  }, []);

  // New method to lookup by registro profissional
  const lookupRegistro = useCallback(async (numero: string, uf: string): Promise<RegistroLookupResult> => {
    const result = await lookupStaffByRegistro(numero, uf);
    return {
      found: result.found,
      hasAuth: result.hasAuth,
      staff: result.staff ? {
        id: result.staff.id,
        name: result.staff.name,
        email: result.staff.email ?? null,
        phone: result.staff.phone ?? null,
        profissao_id: result.staff.profissao_id,
        registro_numero: result.staff.registro_numero,
        registro_uf: result.staff.registro_uf,
        registro_categoria: result.staff.registro_categoria ?? null,
        especialidade_id: result.staff.especialidade?.id ?? null,
        profissao: result.staff.profissao,
      } : undefined,
    };
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

  // New method to sign in with registro profissional
  const signInWithRegistro = useCallback(async (
    conselhoSigla: string,
    numero: string,
    uf: string,
    password: string
  ) => {
    try {
      // Generate auth_email from registro profissional
      const authEmail = generateAuthEmail(conselhoSigla, numero, uf);

      if (!authEmail) {
        return { error: new Error('Registro profissional inválido') };
      }

      // First check if staff exists with this registro
      const { data: staffData, error: lookupError } = await supabase
        .from('medical_staff')
        .select('auth_email')
        .eq('registro_numero', numero)
        .eq('registro_uf', uf.toUpperCase())
        .single();

      if (lookupError || !staffData?.auth_email) {
        return { error: new Error('Registro profissional não encontrado ou sem acesso configurado') };
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
      // Generate auth_email from registro profissional (new format)
      const authEmail = generateAuthEmail(data.conselhoSigla, data.registro_numero, data.registro_uf);

      if (!authEmail) {
        return { error: new Error('Dados de registro profissional inválidos') };
      }

      // Create auth user (with email confirmation disabled for internal auth emails)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: data.password,
        options: {
          data: {
            name: data.name,
            profissao_id: data.profissao_id,
            registro_numero: data.registro_numero,
            registro_uf: data.registro_uf,
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

      // Create medical_staff record with new registro profissional fields
      const { error: staffError } = await supabase
        .from('medical_staff')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          crm: data.crm || null, // Legacy field (deprecated)
          profissao_id: data.profissao_id,
          registro_numero: data.registro_numero,
          registro_uf: data.registro_uf,
          registro_categoria: data.registro_categoria || null,
          especialidade_id: data.especialidade_id,
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
      // Generate auth_email from registro profissional (new format)
      const authEmail = generateAuthEmail(data.conselhoSigla, data.registro_numero, data.registro_uf);

      if (!authEmail) {
        return { error: new Error('Dados de registro profissional inválidos') };
      }

      console.log('Setup password for registro:', data.conselhoSigla, data.registro_numero, data.registro_uf, 'authEmail:', authEmail);

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

  // ============================================================================
  // NEW: CPF-based methods (preferred)
  // ============================================================================

  const lookupCpf = useCallback(async (cpf: string): Promise<CpfLookupResult> => {
    const result = await lookupStaffByCpf(cpf);
    return {
      found: result.found,
      hasAuth: result.hasAuth,
      staff: result.staff ? {
        id: result.staff.id,
        name: result.staff.name,
        email: result.staff.email ?? null,
        phone: result.staff.phone ?? null,
        cpf: result.staff.cpf,
        profissao_id: result.staff.profissao_id ?? null,
        registro_numero: result.staff.registro_numero ?? null,
        registro_uf: result.staff.registro_uf ?? null,
        registro_categoria: result.staff.registro_categoria ?? null,
        especialidade_id: result.staff.especialidade?.id ?? null,
        profissao: result.staff.profissao,
      } : undefined,
    };
  }, []);

  const signInWithCpf = useCallback(async (cpf: string, password: string) => {
    try {
      const normalizedCpf = normalizeCpf(cpf);

      // Look up staff by CPF to get their real email
      const { data: staffData, error: lookupError } = await supabase
        .from('medical_staff')
        .select('email')
        .eq('cpf', normalizedCpf)
        .single();

      if (lookupError || !staffData?.email) {
        return { error: new Error('CPF não encontrado ou sem acesso configurado') };
      }

      // Sign in using the staff's real email
      const { error } = await supabase.auth.signInWithPassword({
        email: staffData.email,
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

  const signUpWithCpf = useCallback(async (data: SignUpWithCpfData) => {
    try {
      const normalizedCpf = normalizeCpf(data.cpf);

      // Use REAL email for auth (not generated auth_email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            cpf: normalizedCpf,
          },
        },
      });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('Falha ao criar usuário') };
      }

      // Sign in immediately to ensure session is active
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.error('SignIn after signup failed:', signInError);
        return { error: signInError };
      }

      // Create medical_staff record with CPF as primary identifier
      const { error: staffError } = await supabase
        .from('medical_staff')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          cpf: normalizedCpf,
          profissao_id: data.profissao_id,
          registro_numero: data.registro_numero,
          registro_uf: data.registro_uf,
          registro_categoria: data.registro_categoria || null,
          especialidade_id: data.especialidade_id,
          color: generateRandomColor(),
          active: true,
          user_id: authData.user.id,
          auth_email: null, // No longer using generated auth_email
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

  const setupPasswordWithCpf = useCallback(async (data: SetupPasswordWithCpfData) => {
    try {
      console.log('Setup password with CPF for staff:', data.staffId);

      // Create auth user with REAL email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
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
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.error('SignIn after signup failed:', signInError);
        return { error: signInError };
      }

      console.log('Updating medical_staff:', data.staffId, 'with user_id:', authData.user.id);

      // Update medical_staff record with user_id and email
      const { error: updateError } = await supabase
        .from('medical_staff')
        .update({
          user_id: authData.user.id,
          email: data.email,
          auth_email: null, // Clear legacy auth_email
        })
        .eq('id', data.staffId);

      if (updateError) {
        console.error('Update medical_staff failed:', updateError);
        return { error: updateError };
      }

      console.log('Setup password with CPF completed successfully');

      // Refresh staff data after update
      await refreshStaff();

      // Navigate to app
      router.replace('/(app)/(tabs)');
      return { error: null };
    } catch (err) {
      console.error('Setup password with CPF error:', err);
      return { error: err as Error };
    }
  }, [refreshStaff]);

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
    loadingState,
    loadingMessage,
    authError,
    retryAuth,
    isAuthenticated: !!session && !!user,
    // Legacy CRM methods (deprecated)
    lookupCrm,
    signInWithCrm,
    // Registro profissional methods (deprecated - use CPF methods)
    lookupRegistro,
    signInWithRegistro,
    signUp,
    setupPassword,
    // NEW: CPF-based methods (preferred)
    lookupCpf,
    signInWithCpf,
    signUpWithCpf,
    setupPasswordWithCpf,
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
