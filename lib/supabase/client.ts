import { createBrowserClient } from "@supabase/ssr"
import { requireSupabaseEnv } from "@/lib/supabase/env"

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!client) {
    const { url, key } = requireSupabaseEnv()
    client = createBrowserClient(url, key)
  }
  return client
}
