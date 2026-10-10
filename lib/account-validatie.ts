import { z } from "zod"

export const naamSchema = z
  .string()
  .trim()
  .min(1, "Vul een naam in.")
  .max(40, "Gebruik maximaal 40 tekens.")

export const emailSchema = z.email("Vul een geldig e-mailadres in.")

// Supabase hasht met bcrypt; langer dan 72 tekens wordt afgekapt.
export const wachtwoordSchema = z
  .string()
  .min(8, "Gebruik minimaal 8 tekens.")
  .max(72, "Gebruik maximaal 72 tekens.")

export const gezinsnaamSchema = z
  .string()
  .trim()
  .min(2, "Kies een gezinsnaam van minimaal twee tekens.")
  .max(60, "Gebruik maximaal 60 tekens.")

export const gebruikersIdSchema = z.uuid()

export type ActieUitkomst = { ok: true } | { ok: false; fout: string }
// Server actions geven verwachte fouten terug als waarde. Een gegooide Error toont Next.js in
// productie zonder tekst, dus de gebruiker zou de uitleg nooit zien.
export type Uitkomst<T extends object = object> = ({ ok: true } & T) | { ok: false; fout: string }

export function eersteFout(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Controleer je invoer."
}
