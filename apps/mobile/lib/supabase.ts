import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://shqbwmcffoxzvmorudna.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get current user's medical_staff record
export async function getCurrentStaff() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  console.log('Getting staff for user:', user.id);

  const { data: staff, error } = await supabase
    .from('medical_staff')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching staff:', error);
    return null;
  }

  console.log('Current staff:', staff);
  return staff;
}

// Helper function to lookup staff by CRM
export async function lookupStaffByCrm(crm: string) {
  console.log('Looking up CRM:', crm);

  const { data: staff, error } = await supabase
    .from('medical_staff')
    .select('id, name, email, phone, crm, specialty, role, user_id, auth_email')
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
      specialty: staff.specialty,
      role: staff.role,
    },
  };
}
