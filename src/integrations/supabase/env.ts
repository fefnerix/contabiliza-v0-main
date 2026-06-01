/** Evita strings inválidas vindas de .env quebrado (ex.: VITE_SUPABASE_URL=undefined). */
export function readViteEnv(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

export function isSupabaseEnvConfigured(): boolean {
  const url = readViteEnv(import.meta.env.VITE_SUPABASE_URL);
  const key = readViteEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
  return !!(url && key);
}

export function getSupabaseEnvOrThrow(): { url: string; anonKey: string } {
  const url = readViteEnv(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = readViteEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars");
  }

  return { url, anonKey };
}
