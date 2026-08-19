import { createNeonAuth } from "@neondatabase/auth/next/server"

// Centraal toegangspunt voor alle server-side authenticatie: sessies
// ophalen, uitloggen, gezinnen (organizations) en uitnodigingen beheren.
// Dit gebruikt Neon's managed auth-service (ingesteld via Neon Console),
// niet een zelfgehoste better-auth-installatie. Zie LEES_MIJ.md voor de
// Neon Console instellingen die hierbij horen.
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ?? process.env.BETTER_AUTH_SECRET

if (!cookieSecret) {
  throw new Error(
    "Missing auth cookie secret: set NEON_AUTH_COOKIE_SECRET or BETTER_AUTH_SECRET.",
  )
}

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: cookieSecret,
    sessionDataTtl: 300,
  },
})
