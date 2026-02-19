import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Client for public access (Subject to RLS if used, but we are moving away from client-side direct calls)
export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return supabase;
}

// Client for server-side admin access (Bypasses RLS if using Service Role Key)
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    // If no service key, fallback to standard client but warn?
    // Actually, if we use RLS that blocks 'anon', we NEED service key for our Server Actions to work.
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY missing. Admin operations may fail due to RLS.");
    return getSupabaseClient();
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

