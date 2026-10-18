import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase/env"
import { proxyDoorstuurPad } from "@/lib/supabase/proxy-beleid"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const env = getSupabaseEnv()

  const { pathname } = request.nextUrl
  if (!env) {
    const doel = proxyDoorstuurPad(pathname, false)
    return doel ? NextResponse.redirect(new URL(doel, request.url)) : response
  }

  const supabase = createServerClient(
    env.url,
    env.key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // getClaims controleert het token lokaal (via de publieke sleutel van je project) en vernieuwt
  // de sessie als die is verlopen. Dat scheelt een netwerkaanroep naar Supabase bij elke
  // navigatie en elke voorgeladen link. Pagina's en acties controleren de gebruiker daarna
  // nog steeds zelf met getUser(), dus een verwijderd account komt nergens binnen.
  // Bij een project met de oudere gedeelde JWT-sleutel valt getClaims vanzelf terug op een
  // netwerkaanroep.
  const { data: claimsData } = await supabase.auth.getClaims()
  const heeftClaims = Boolean(claimsData?.claims?.sub)
  // Let op: hier bewust geen redirect van /login naar "/" voor wie claims heeft. getClaims
  // controleert alleen de JWT lokaal; bestaat de sessie bij Supabase niet meer (ingetrokken,
  // gebruiker verwijderd, uitgelogd op een ander apparaat) dan stuurt de layout (getUser) naar
  // /login terug en ontstaat een eindeloze lus. De loginpagina doet die redirect zelf met getUser().
  const doel = proxyDoorstuurPad(pathname, heeftClaims)
  if (doel) return NextResponse.redirect(new URL(doel, request.url))
  return response
}
