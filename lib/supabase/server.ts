import { cache } from "react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { requireSupabaseEnv } from "@/lib/supabase/env"

export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = requireSupabaseEnv()

  return createServerClient(url, key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Components kunnen geen cookies schrijven. Dat is normaal: de proxy
            // (middleware) en server actions vernieuwen de sessie wel.
          }
        },
      },
    },
  )
}

// De ingelogde gebruiker, één keer per verzoek opgehaald. Layout, pagina en acties die in
// hetzelfde verzoek draaien delen hiermee één netwerkaanroep naar Supabase in plaats van
// er elk een eigen te doen. Gebruik voor wijzigingen aan de sessie zelf (inloggen,
// wachtwoord wijzigen) niet deze functie maar `supabase.auth` rechtstreeks.
export const getGebruiker = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
