import { auth } from "@/lib/auth/server"

// Beveiligt alle routes: niet-ingelogde bezoekers gaan naar /login.
// Het uitzoeken van "wel ingelogd maar nog geen gezin" gebeurt bewust niet
// hier, maar in app/(app)/layout.tsx en app/gezin/starten — daar hebben we
// de volledige sessie (incl. actief gezin) al nodig om de juiste pagina te
// tonen, dus dat werk niet dubbel doen in de proxy-laag.
export default auth.middleware({ loginUrl: "/login" })

export const config = {
  // Beveilig alle routes behalve statische bestanden, de auth-API zelf en
  // het manifest/serviceworker die de browser zonder sessie moet kunnen
  // ophalen.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$|.*\\.svg$).*)",
  ],
}
