import { auth } from "@/lib/auth/server"

// Beveiligt alle routes: niet-ingelogde bezoekers gaan naar /login.
export default auth.middleware({ loginUrl: "/login" })

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$|.*\\.svg$).*)",
  ],
}