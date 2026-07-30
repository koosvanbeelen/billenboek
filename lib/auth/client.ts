"use client"

import { createAuthClient } from "@neondatabase/auth/next"

// Client-instantie voor gebruik in client components: inloggen via
// e-mail+wachtwoord, e-mailverificatie met code, sessie uitlezen, gezin
// (organization) aanmaken/beheren. Dit spreekt Neon's managed auth-service
// aan (ingesteld via Neon Console), geen zelfgehoste better-auth.
export const authClient = createAuthClient()
