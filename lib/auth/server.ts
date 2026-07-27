import { createNeonAuth } from "@neondatabase/auth/next/server"

// Centraal toegangspunt voor alle server-side authenticatie: sessies
// ophalen, uitloggen, gezinnen (organizations) en uitnodigingen beheren.
// Zie LEES_MIJ.md voor de Neon Console instellingen die hierbij horen.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    sessionDataTtl: 300,
  },
})
