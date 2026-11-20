import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim();

export function isSupabaseConfigured(): boolean {
  return !!url && !!publishableKey;
}

let client: SupabaseClient | null = null;

/**
 * The only place the Supabase client is created. Uses the public publishable key (sb_publishable_..., or the legacy anon key): row level security in the
 * private backend repo is what protects the data. Never put a service key in this repo.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url as string, publishableKey as string, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return client;
}
