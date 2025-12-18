import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

console.log('[Supabase] Module loading...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://shqbwmcffoxzvmorudna.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[Supabase] URL:', supabaseUrl ? 'configured' : 'missing');
console.log('[Supabase] Anon Key:', supabaseAnonKey ? 'configured' : 'missing');

// SecureStore has a 2048 byte limit per item
const SECURE_STORE_LIMIT = 2048;

// Timeout for storage operations (in milliseconds)
const STORAGE_TIMEOUT_MS = 5000;

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
}

// Custom storage adapter for React Native
// Uses SecureStore for small values (< 2048 bytes) and AsyncStorage for larger values
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    console.log('[Storage] getItem called for key:', key);

    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }

    // Try SecureStore first with timeout to prevent infinite loading on first launch
    try {
      console.log('[Storage] Trying SecureStore.getItemAsync...');
      const value = await withTimeout(
        SecureStore.getItemAsync(key),
        STORAGE_TIMEOUT_MS,
        null
      );
      console.log('[Storage] SecureStore returned:', value ? 'value found' : 'null');
      if (value !== null) {
        return value;
      }
    } catch (e) {
      console.log('[Storage] SecureStore error:', e);
      // Ignore SecureStore errors and try AsyncStorage
    }

    // Fall back to AsyncStorage for large values (also with timeout)
    try {
      console.log('[Storage] Trying AsyncStorage.getItem...');
      const value = await withTimeout(
        AsyncStorage.getItem(key),
        STORAGE_TIMEOUT_MS,
        null
      );
      console.log('[Storage] AsyncStorage returned:', value ? 'value found' : 'null');
      return value;
    } catch (e) {
      console.log('[Storage] AsyncStorage error:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }

    // Use SecureStore for small values, AsyncStorage for large values
    if (value.length < SECURE_STORE_LIMIT) {
      // Remove from AsyncStorage if it exists there (from a previous large value)
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
      await SecureStore.setItemAsync(key, value);
    } else {
      // Remove from SecureStore if it exists there (from a previous small value)
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // Ignore errors
      }
      await AsyncStorage.setItem(key, value);
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
