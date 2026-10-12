import { z } from "zod"

// Gedeeld tussen server en client: het type Kind, de labels en de validatie.

export const GESLACHTEN = ["jongen", "meisje", "anders"] as const
export type Geslacht = (typeof GESLACHTEN)[number]

export const GESLACHT_LABEL: Record<Geslacht, string> = {
  jongen: "Jongen",
  meisje: "Meisje",
  anders: "Anders",
}

export type Kind = {
  id: number
  naam: string
  // "yyyy-MM-dd"
  geboortedatum: string | null
  geslacht: Geslacht | null
  geboortegewichtGram: number | null
}

// Naam van de cookie waarin het actieve kind staat. Niet httpOnly: de client leest 'm om te
// merken dat een ander tabblad van kind is gewisseld. De waarde wordt op de server altijd
// gecontroleerd tegen de kinderen van het gezin, dus er valt niets mee te manipuleren.
export const KIND_COOKIE = "billenboek_kind"

// Invoer uit het formulier: alles is tekst, optionele velden mogen leeg zijn.
export const kindSchema = z.object({
  naam: z
    .string()
    .trim()
    .min(1, "Vul de naam van je kind in.")
    .max(40, "Gebruik maximaal 40 tekens."),
  geboortedatum: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Kies een geldige datum.")
    .refine((v) => v === "" || !Number.isNaN(Date.parse(`${v}T12:00:00Z`)), "Kies een geldige datum.")
    // Een dag marge: de server rekent in UTC, de gebruiker in Nederlandse tijd.
    .refine((v) => v === "" || v <= new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), "De geboortedatum ligt in de toekomst.")
    .refine((v) => v === "" || v >= "2000-01-01", "Kies een geldige datum."),
  geslacht: z.union([z.enum(GESLACHTEN), z.literal("")]),
  // Gewicht in gram, als tekst (leeg = niet ingevuld).
  geboortegewichtGram: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{3,4}$/.test(v), "Vul het gewicht in hele grammen in, bijvoorbeeld 3450.")
    .refine((v) => v === "" || (Number(v) >= 300 && Number(v) <= 8000), "Vul een gewicht tussen 300 en 8000 gram in."),
})

export type KindInvoer = z.infer<typeof kindSchema>

export const LEEG_KIND: KindInvoer = { naam: "", geboortedatum: "", geslacht: "", geboortegewichtGram: "" }

export function kindNaarInvoer(kind: Kind): KindInvoer {
  return {
    naam: kind.naam,
    geboortedatum: kind.geboortedatum ?? "",
    geslacht: kind.geslacht ?? "",
    geboortegewichtGram: kind.geboortegewichtGram === null ? "" : String(kind.geboortegewichtGram),
  }
}

// Korte leeftijdsomschrijving voor in de lijst, bijvoorbeeld "3 weken" of "5 maanden".
export function formatLeeftijd(geboortedatum: string, nu: Date = new Date()): string {
  const [j, m, d] = geboortedatum.split("-").map(Number)
  const geboren = new Date(Date.UTC(j, m - 1, d))
  const vandaag = new Date(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()))
  const dagen = Math.floor((vandaag.getTime() - geboren.getTime()) / 86_400_000)
  if (dagen < 0) return ""
  if (dagen < 14) return dagen === 1 ? "1 dag" : `${dagen} dagen`
  if (dagen < 63) return `${Math.floor(dagen / 7)} weken`
  let maanden = (vandaag.getUTCFullYear() - geboren.getUTCFullYear()) * 12 + (vandaag.getUTCMonth() - geboren.getUTCMonth())
  if (vandaag.getUTCDate() < geboren.getUTCDate()) maanden -= 1
  if (maanden < 24) return `${maanden} maanden`
  const jaren = Math.floor(maanden / 12)
  return `${jaren} jaar`
}
