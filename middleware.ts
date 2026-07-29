import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Publieke routes die geen sessie vereisen.
const publiek = new Set([
  "/login",
  "/gezin/starten",
  "/wachtwoord-vergeten",
  "/uitnodiging",
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Better Auth slaat de sessie op als "better-auth.session_token".
  // In development (iframe) kan het cookie ook zonder "__Secure-" prefix zijn.
  const heeftSessie = Boolean(
    request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token"),
  )

  const isPubliek =
    publiek.has(pathname) ||
    pathname.startsWith("/uitnodiging")

  if (!heeftSessie && !isPubliek) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("callbackURL", pathname)
    return NextResponse.redirect(url)
  }

  if (heeftSessie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$|.*\\.svg$).*)",
  ],
}
