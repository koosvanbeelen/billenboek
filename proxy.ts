import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/server"

// Beveiligt alle routes: niet-ingelogde bezoekers gaan naar /login.
// Server Action-verzoeken (te herkennen aan de Next-Action-header) worden
// doorgelaten zonder deze check: authenticatie daarvoor wordt binnen de
// Server Actions zelf afgehandeld (zie lib/db/gezin.ts), en de auth-check
// hier op dat type verzoek toepassen veroorzaakt een kapotte redirect naar
// een HTML-pagina in plaats van het verwachte Server Action-antwoord.
const authMiddleware = auth.middleware({ loginUrl: "/login" })

export default function proxy(request: NextRequest) {
  if (request.headers.has("Next-Action")) {
    return
  }
  return authMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$|.*\\.svg$).*)",
  ],
}