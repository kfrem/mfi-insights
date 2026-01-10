import { createClient, SupabaseClient } from '@supabase/supabase-js';

// External Supabase client for MFI data (mfi and mfi_reporting schemas)
const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL || '';
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY || '';

// Check if external Supabase is configured
export const isExternalSupabaseConfigured = () => {
  return !!EXTERNAL_SUPABASE_URL && !!EXTERNAL_SUPABASE_ANON_KEY;
};

// Lazy-initialized client to prevent errors when env vars aren't set
let _externalSupabase: SupabaseClient | null = null;

export const getExternalSupabase = (): SupabaseClient | null => {
  if (!isExternalSupabaseConfigured()) {
    return null;
  }
  
  if (!_externalSupabase) {
    _externalSupabase = createClient(
      EXTERNAL_SUPABASE_URL,
      EXTERNAL_SUPABASE_ANON_KEY,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    );
  }
  
  return _externalSupabase;
};
