import type { z } from "zod"

// Technische details alleen naar de serverlog, nooit naar de gebruiker.
export function logFout(context: string, error: unknown) {
  const tekst = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error)
  console.error(`[${context}]`, tekst)
}

// Databasefout: loggen en een nette, algemene fout gooien (geen ruwe Supabase-details).
export function dbFout(context: string, error: unknown, bericht = "Er ging iets mis. Probeer het opnieuw."): Error {
  logFout(context, error)
  return new Error(bericht)
}

// Zod-validatie die geen ruwe ZodError gooit. De formulieren valideren zelf al; een fout
// hier betekent een verkeerd of aangepast verzoek.
export function parseInvoer<T>(schema: z.ZodType<T>, input: unknown, context = "invoer"): T {
  const resultaat = schema.safeParse(input)
  if (!resultaat.success) {
    logFout(context, resultaat.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "))
    throw new Error("De ingevulde gegevens zijn niet geldig.")
  }
  return resultaat.data
}
