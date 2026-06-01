import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabaseEnvOrThrow } from "./env";

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = getSupabaseEnvOrThrow();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
