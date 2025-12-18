import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

console.log('[Supabase] Module loading...');

// Get environment variables from expo config (more reliable in monorepos)
const extra = Constants.expoConfig?.extra;
const supabaseUrl = extra?.supabaseUrl || 'https://shqbwmcffoxzvmorudna.supabase.co';
const supabaseAnonKey = extra?.supabaseAnonKey || '';

console.log('[Supabase] URL:', supabaseUrl ? 'configured' : 'missing');
console.log('[Supabase] Anon Key:', supabaseAnonKey ? 'configured' : 'missing');

// SecureStore has a 2048 byte limit per item
const SECURE_STORE_LIMIT = 2048;

// Timeout for storage operations (in milliseconds)
const STORAGE_TIMEOUT_MS = 8000; // Increased to 8s for better reliability
const STORAGE_TIMEOUT_FIRST_LAUNCH_MS = 15000; // 15s for first launch when SecureStore may be slow

// Track if this is the first storage access (SecureStore may be slow on first access)
let isFirstStorageAccess = true;

// Custom error class for storage timeouts
class StorageTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Storage operation timed out after ${timeoutMs}ms: ${operation}`);
    this.name = 'StorageTimeoutError';
  }
}

// Helper function to add timeout to promises - throws on timeout instead of returning null
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  const result = await Promise.race([
    promise.then(value => ({ type: 'success' as const, value })),
    new Promise<{ type: 'timeout' }>((resolve) =>
      setTimeout(() => resolve({ type: 'timeout' }), timeoutMs)
    ),
  ]);

  if (result.type === 'timeout') {
    throw new StorageTimeoutError(operationName, timeoutMs);
  }

  return result.value;
}

// Helper function to retry operations with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`[Storage] ${operationName} attempt ${attempt + 1}/${maxRetries} failed:`, error);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Storage] Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// Custom storage adapter for React Native
// Uses SecureStore for small values (< 2048 bytes) and AsyncStorage for larger values
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    console.log('[Storage] getItem called for key:', key);

    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }

    // Use longer timeout on first access (SecureStore may be slow to initialize)
    const timeoutMs = isFirstStorageAccess ? STORAGE_TIMEOUT_FIRST_LAUNCH_MS : STORAGE_TIMEOUT_MS;
    console.log(`[Storage] Using timeout: ${timeoutMs}ms (first access: ${isFirstStorageAccess})`);

    // Try to get from SecureStore first with retry
    const getFromSecureStore = async (): Promise<string | null> => {
      try {
        console.log('[Storage] Trying SecureStore.getItemAsync...');
        const value = await withTimeout(
          SecureStore.getItemAsync(key),
          timeoutMs,
          'SecureStore.getItem'
        );
        console.log('[Storage] SecureStore returned:', value ? 'value found' : 'null');
        return value;
      } catch (error) {
        if (error instanceof StorageTimeoutError) {
          console.warn('[Storage] SecureStore timed out, will check AsyncStorage');
          throw error; // Re-throw timeout to trigger retry
        }
        // For other errors (like SecureStore not available), return null
        console.log('[Storage] SecureStore error (non-timeout):', error);
        return null;
      }
    };

    // Try SecureStore with retry
    try {
      const value = await withRetry(
        getFromSecureStore,
        2, // 2 retries for SecureStore
        1000,
        'SecureStore.getItem'
      );

      isFirstStorageAccess = false; // Mark first access complete

      if (value !== null) {
        return value;
      }
    } catch (error) {
      console.log('[Storage] SecureStore failed after retries:', error);
      // Continue to try AsyncStorage
    }

    // SecureStore returned null or failed - try AsyncStorage (for large values)
    try {
      console.log('[Storage] Trying AsyncStorage.getItem...');
      const value = await withRetry(
        async () => {
          return await withTimeout(
            AsyncStorage.getItem(key),
            timeoutMs,
            'AsyncStorage.getItem'
          );
        },
        2, // 2 retries for AsyncStorage
        500,
        'AsyncStorage.getItem'
      );

      isFirstStorageAccess = false;
      console.log('[Storage] AsyncStorage returned:', value ? 'value found' : 'null');
      return value;
    } catch (error) {
      console.error('[Storage] AsyncStorage failed after retries:', error);
      isFirstStorageAccess = false;
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log('[Storage] setItem called for key:', key, 'value length:', value.length);

    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }

    const timeoutMs = STORAGE_TIMEOUT_MS;

    // Use SecureStore for small values, AsyncStorage for large values
    if (value.length < SECURE_STORE_LIMIT) {
      // Remove from AsyncStorage if it exists there (from a previous large value)
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // Ignore errors
      }

      // Save to SecureStore with retry
      await withRetry(
        async () => {
          await withTimeout(
            SecureStore.setItemAsync(key, value),
            timeoutMs,
            'SecureStore.setItem'
          );
        },
        3,
        500,
        'SecureStore.setItem'
      );
      console.log('[Storage] Saved to SecureStore');
    } else {
      // Remove from SecureStore if it exists there (from a previous small value)
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // Ignore errors
      }

      // Save to AsyncStorage with retry
      await withRetry(
        async () => {
          await withTimeout(
            AsyncStorage.setItem(key, value),
            timeoutMs,
            'AsyncStorage.setItem'
          );
        },
        3,
        500,
        'AsyncStorage.setItem'
      );
      console.log('[Storage] Saved to AsyncStorage (large value)');
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }

    // Remove from both stores to ensure cleanup
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore errors
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

// Auth storage key used by Supabase
const AUTH_STORAGE_KEY = `sb-${supabaseUrl.replace('https://', '').split('.')[0]}-auth-token`;

// Function to clear auth storage directly (useful when signOut hangs)
export async function clearAuthStorage() {
  console.log('[Storage] Clearing auth storage for key:', AUTH_STORAGE_KEY);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return;
  }

  // Remove from both stores
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    console.log('[Storage] SecureStore cleared');
  } catch (e) {
    console.log('[Storage] SecureStore clear error (ignored):', e);
  }
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('[Storage] AsyncStorage cleared');
  } catch (e) {
    console.log('[Storage] AsyncStorage clear error (ignored):', e);
  }
}

console.log('[Supabase] Creating client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
console.log('[Supabase] Client created successfully');

// Helper function to get current user's medical_staff record
export async function getCurrentStaff() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  console.log('Getting staff for user:', user.id);

  const { data: staff, error } = await supabase
    .from('medical_staff')
    .select('*, especialidade:especialidade_id(id, nome, created_at)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching staff:', error);
    return null;
  }

  console.log('Current staff:', staff);
  return staff;
}

// Helper function to lookup staff by CRM (deprecated - use lookupStaffByRegistro)
export async function lookupStaffByCrm(crm: string) {
  console.log('Looking up CRM:', crm);

  const { data: staff, error } = await supabase
    .from('medical_staff')
    .select('id, name, email, phone, crm, user_id, auth_email, especialidade:especialidade_id(id, nome)')
    .eq('crm', crm)
    .maybeSingle(); // Use maybeSingle instead of single to avoid error when not found

  console.log('Lookup result:', { staff, error });

  if (error) {
    console.error('Error looking up CRM:', error);
    throw error;
  }

  if (!staff) {
    console.log('No staff found for CRM:', crm);
    return { found: false, hasAuth: false, staff: undefined };
  }

  console.log('Found staff:', staff.name, 'hasAuth:', !!staff.user_id);
  return {
    found: true,
    hasAuth: !!staff.user_id,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      crm: staff.crm,
      especialidade: staff.especialidade,
    },
  };
}

// New function to lookup staff by registro profissional (numero + uf)
export async function lookupStaffByRegistro(numero: string, uf: string) {
  console.log('Looking up registro:', numero, uf);

  const { data: staff, error } = await supabase
    .from('medical_staff')
    .select(`
      id, name, email, phone, crm, user_id, auth_email,
      registro_numero, registro_uf, registro_categoria,
      profissao_id,
      especialidade:especialidade_id(id, nome),
      profissao:profissao_id(
        id, nome,
        conselho:conselho_id(id, sigla, nome_completo)
      )
    `)
    .eq('registro_numero', numero)
    .eq('registro_uf', uf.toUpperCase())
    .maybeSingle();

  console.log('Lookup result:', { staff, error });

  if (error) {
    console.error('Error looking up registro:', error);
    throw error;
  }

  if (!staff) {
    console.log('No staff found for registro:', numero, uf);
    return { found: false, hasAuth: false, staff: undefined };
  }

  // Flatten nested relationships (Supabase returns arrays)
  const flatEspecialidade = Array.isArray(staff.especialidade)
    ? staff.especialidade[0]
    : staff.especialidade;

  const rawProfissao = Array.isArray(staff.profissao)
    ? staff.profissao[0]
    : staff.profissao;

  const flatProfissao = rawProfissao ? {
    id: rawProfissao.id,
    nome: rawProfissao.nome,
    conselho: Array.isArray(rawProfissao.conselho)
      ? rawProfissao.conselho[0]
      : rawProfissao.conselho,
  } : null;

  console.log('Found staff:', staff.name, 'hasAuth:', !!staff.user_id);
  return {
    found: true,
    hasAuth: !!staff.user_id,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      crm: staff.crm,
      profissao_id: staff.profissao_id,
      registro_numero: staff.registro_numero,
      registro_uf: staff.registro_uf,
      registro_categoria: staff.registro_categoria,
      especialidade: flatEspecialidade,
      profissao: flatProfissao,
    },
  };
}

// New function to lookup staff by CPF
// Interface for profile update data
export interface UpdateProfileData {
  name: string;
  email?: string | null;
  phone?: string | null;
  profissao_id: string;
  especialidade_id: string;
  registro_numero: string;
  registro_uf: string;
  registro_categoria?: string | null;
}

// Function to update staff profile
export async function updateStaffProfile(staffId: string, data: UpdateProfileData) {
  const { data: updated, error } = await supabase
    .from('medical_staff')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      profissao_id: data.profissao_id,
      especialidade_id: data.especialidade_id,
      registro_numero: data.registro_numero,
      registro_uf: data.registro_uf,
      registro_categoria: data.registro_categoria,
      updated_at: new Date().toISOString(),
    })
    .eq('id', staffId)
    .select('*, especialidade:especialidade_id(id, nome), profissao:profissao_id(id, nome, conselho:conselho_id(id, nome_completo, sigla))')
    .single();

  return { data: updated, error };
}

export async function lookupStaffByCpf(cpf: string) {
  // Normalize CPF to digits only
  const normalizedCpf = cpf.replace(/\D/g, '');
  console.log('Looking up CPF:', normalizedCpf);

  const { data: staff, error } = await supabase
    .from('medical_staff')
    .select(`
      id, name, email, phone, cpf, user_id, auth_email,
      registro_numero, registro_uf, registro_categoria,
      profissao_id,
      especialidade:especialidade_id(id, nome),
      profissao:profissao_id(
        id, nome,
        conselho:conselho_id(id, sigla, nome_completo)
      )
    `)
    .eq('cpf', normalizedCpf)
    .maybeSingle();

  console.log('Lookup result:', { staff, error });

  if (error) {
    console.error('Error looking up CPF:', error);
    throw error;
  }

  if (!staff) {
    console.log('No staff found for CPF:', normalizedCpf);
    return { found: false, hasAuth: false, staff: undefined };
  }

  // Flatten nested relationships (Supabase returns arrays)
  const flatEspecialidade = Array.isArray(staff.especialidade)
    ? staff.especialidade[0]
    : staff.especialidade;

  const rawProfissao = Array.isArray(staff.profissao)
    ? staff.profissao[0]
    : staff.profissao;

  const flatProfissao = rawProfissao ? {
    id: rawProfissao.id,
    nome: rawProfissao.nome,
    conselho: Array.isArray(rawProfissao.conselho)
      ? rawProfissao.conselho[0]
      : rawProfissao.conselho,
  } : null;

  console.log('Found staff:', staff.name, 'hasAuth:', !!staff.user_id);
  return {
    found: true,
    hasAuth: !!staff.user_id,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      cpf: staff.cpf,
      profissao_id: staff.profissao_id,
      registro_numero: staff.registro_numero,
      registro_uf: staff.registro_uf,
      registro_categoria: staff.registro_categoria,
      especialidade: flatEspecialidade,
      profissao: flatProfissao,
    },
  };
}
