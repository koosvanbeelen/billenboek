import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase/env"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const env = getSupabaseEnv()

  const { pathname } = request.nextUrl
  const publicRoute = pathname === "/login" || pathname === "/registreren" || pathname === "/wachtwoord-vergeten" || pathname === "/gezin/deelnemen" || pathname === "/gezin/onboarding" || pathname.startsWith("/auth/")
  if (!env) {
    if (publicRoute) return response
    return NextResponse.redirect(new URL("/login", request.url))
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
  const user = claimsData?.claims?.sub ? claimsData.claims : null
  if (!user && !publicRoute) return NextResponse.redirect(new URL("/login", request.url))
  if (user && pathname === "/login") return NextResponse.redirect(new URL("/", request.url))
  return response
}
