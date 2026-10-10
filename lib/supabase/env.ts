// Eén plek voor de Supabase-configuratie. Elke variabele staat letterlijk uitgeschreven zodat
// Next.js de NEXT_PUBLIC_-waarden ook in de browserbundel kan invullen.
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY
  return url && key ? { url, key } : null
}

export function requireSupabaseEnv(): { url: string; key: string } {
  const env = getSupabaseEnv()
  if (!env) throw new Error("Supabase runtime configuration is missing")
  return env
}
