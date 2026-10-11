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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !publicRoute) return NextResponse.redirect(new URL("/login", request.url))
  if (user && pathname === "/login") return NextResponse.redirect(new URL("/", request.url))
  return response
}
