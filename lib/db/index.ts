import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    // Supabase-compute blijft altijd actief (geen scale-to-zero zoals Neon),
    // dus deze ruime timeout is hier niet strikt nodig, maar doet geen kwaad
    // als vangnet bij netwerkhaperingen.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    // Supabase vereist SSL op de externe connectie. rejectUnauthorized: false
    // is nodig omdat Supabase een certificaat gebruikt dat niet in Node's
    // standaard CA-store zit.
    ssl: { rejectUnauthorized: false },
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
