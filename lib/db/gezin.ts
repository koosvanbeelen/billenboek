import { sql } from "drizzle-orm"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"

/**
 * Haalt het gezin (Neon Auth organization) op waarin de ingelogde gebruiker
 * nu actief is. Dit is de enige plek waar we de sessie raadplegen om te
 * bepalen "van welk gezin zijn deze gegevens".
 *
 * Stuurt de gebruiker automatisch door als er geen sessie of geen actief
 * gezin is, zodat server actions nooit per ongeluk zonder gezin data
 * proberen te lezen/schrijven.
 */
export async function huidigGezinId(): Promise<string> {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const gezinId = session.session?.activeOrganizationId as string | null | undefined

  if (!gezinId) {
    redirect("/gezin/starten")
  }

  return gezinId
}

/**
 * Voert `fn` uit binnen één databasetransactie waarin de Postgres
 * sessievariabele `app.huidig_gezin_id` is gezet op het actieve gezin van de
 * ingelogde gebruiker. Alle tabellen hebben Row Level Security aan staan
 * (zie LEES_MIJ_migratie_stap2.sql) die op deze variabele filtert, dus
 * `db.select()`, `db.insert()`, `db.update()` en `db.delete()` binnen `fn`
 * werken automatisch alleen op de rijen van dit gezin.
 *
 * Gebruik: geef de callback-parameter de naam `db` (schaduwt de module-brede
 * `db` import) zodat bestaande queries in server actions ongewijzigd
 * blijven werken.
 *
 *   export async function getNotities() {
 *     return metHuidigGezin(async (db) => {
 *       return db.select().from(notities)
 *     })
 *   }
 */
export async function metHuidigGezin<T>(
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  const gezinId = await huidigGezinId()

  return db.transaction(async (tx) => {
    // set_config(..., true) is transactie-lokaal (vergelijkbaar met
    // SET LOCAL) en accepteert een normale query-parameter, dus dit is
    // veilig tegen SQL-injectie.
    await tx.execute(
      sql`select set_config('app.huidig_gezin_id', ${gezinId}, true)`,
    )
    return fn(tx)
  })
}
