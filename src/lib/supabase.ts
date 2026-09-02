import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('your-supabase')) {
    return { url: envUrl, anonKey: envKey };
  }

  const localUrl = localStorage.getItem('antfinserv_supabase_url');
  const localKey = localStorage.getItem('antfinserv_supabase_key');
  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey };
  }

  return null;
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('antfinserv_supabase_url', url.trim());
  localStorage.setItem('antfinserv_supabase_key', key.trim());
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey);
  }
  return supabaseInstance;
}
