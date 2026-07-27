"use client"

import { createAuthClient } from "@neondatabase/auth/next"

// Client-instantie voor gebruik in client components: inloggen via magic
// link, sessie uitlezen, gezin (organization) aanmaken/beheren.
export const authClient = createAuthClient()
