import { z } from "zod"

// datetime-local waarde: "yyyy-MM-ddTHH:mm"
const datumTijd = z
  .string()
  .min(1, "Datum en tijd zijn verplicht")
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Ongeldige datum of tijd")

export const voedingSchema = z
  .object({
    datumTijd,
    type: z.enum(["borstvoeding", "kolfmelk", "kunstvoeding"]),
    borst: z
      .enum(["links", "rechts", "links-rechts", "rechts-links", "beide"])
      .optional(),
    duurMinuten: z.coerce.number().int().min(0).max(360).optional(),
    hoeveelheidMl: z.coerce.number().int().min(0).max(2000).optional(),
    notitie: z.string().max(500).optional(),
  })
  .refine(
    (d) => d.type !== "borstvoeding" || !!d.borst,
    { message: "Kies welke borst", path: ["borst"] },
  )

export const luierSchema = z
  .object({
    datumTijd,
    plas: z.boolean().default(false),
    poep: z.boolean().default(false),
    schoon: z.boolean().default(false),
  })
  .refine((d) => d.plas || d.poep || d.schoon, {
    message: "Kies minstens één optie",
    path: ["plas"],
  })

export const temperatuurSchema = z.object({
  datumTijd,
  temperatuur: z.coerce
    .number({ message: "Vul een temperatuur in" })
    .min(30, "Te laag")
    .max(45, "Te hoog"),
})

export const boertjeSchema = z.object({
  datumTijd,
  notitie: z.string().max(500).optional(),
})

export const vitamineSchema = z
  .object({
    datumTijd,
    vitamineK: z.boolean().default(false),
    vitamineD: z.boolean().default(false),
  })
  .refine((d) => d.vitamineK || d.vitamineD, {
    message: "Kies minstens één vitamine",
    path: ["vitamineK"],
  })

export const medicatieSchema = z.object({
  datumTijd,
  naam: z.string().min(1, "Naam is verplicht").max(120),
  dosering: z.string().max(120).optional(),
  notitie: z.string().max(500).optional(),
})

export const groeiSchema = z
  .object({
    datumTijd,
    gewichtKg: z.coerce.number().min(0).max(50).optional(),
    lengteCm: z.coerce.number().min(0).max(150).optional(),
    opmerking: z.string().max(500).optional(),
  })
  .refine((d) => d.gewichtKg !== undefined || d.lengteCm !== undefined, {
    message: "Vul gewicht of lengte in",
    path: ["gewichtKg"],
  })

export const slaapSchema = z
  .object({
    start: datumTijd,
    einde: datumTijd,
    locatie: z.string().max(120).optional(),
    notitie: z.string().max(500).optional(),
  })
  .refine((d) => new Date(`${d.einde}:00.000Z`) > new Date(`${d.start}:00.000Z`), {
    message: "Einde moet na start liggen",
    path: ["einde"],
  })

export const huilSchema = z
  .object({
    start: datumTijd,
    einde: datumTijd,
    oorzaak: z.string().max(120).optional(),
    troost: z.string().max(120).optional(),
  })
  .refine((d) => new Date(`${d.einde}:00.000Z`) > new Date(`${d.start}:00.000Z`), {
    message: "Einde moet na start liggen",
    path: ["einde"],
  })

export const kolfSchema = z.object({
  datumTijd,
  borst: z.enum(["links", "rechts", "beide"]),
  hoeveelheidMl: z.coerce
    .number({ message: "Vul de hoeveelheid in" })
    .int()
    .min(0)
    .max(2000),
  notitie: z.string().max(500).optional(),
})

export const notitieSchema = z.object({
  // Max is verhoogd t.o.v. voorheen omdat opmaaktekens (**, *, -, [ ], 1.)
  // meetellen in de lengte van de opgeslagen tekst.
  notitie: z.string().min(1, "Schrijf eerst iets").max(4000),
})

export const kindSchema = z.object({
  naam: z.string().min(1, "Vul een naam in").max(100),
  geboortedatum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum")
    .optional()
    .or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Account & gezin aanmaken (e-mail + wachtwoord)
// ---------------------------------------------------------------------------
const email = z
  .string()
  .min(1, "Vul een e-mailadres in")
  .email("Ongeldig e-mailadres")

const wachtwoord = z
  .string()
  .min(8, "Minimaal 8 tekens")
  .max(128, "Maximaal 128 tekens")

export const inloggenSchema = z.object({
  email,
  wachtwoord: z.string().min(1, "Vul je wachtwoord in"),
})

export const registrerenSchema = z.object({
  email,
  wachtwoord,
  gezinNaam: z.string().min(1, "Vul een gezinsnaam in").max(100),
  kindNaam: z.string().min(1, "Vul een naam in").max(100),
  geboortedatum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum")
    .optional()
    .or(z.literal("")),
  partnerEmail: email.optional().or(z.literal("")),
})

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Vul de 6-cijferige code in")
    .regex(/^\d{6}$/, "Alleen cijfers"),
})

export const wachtwoordVergetenSchema = z.object({ email })

export const wachtwoordResetSchema = z.object({
  otp: z
    .string()
    .length(6, "Vul de 6-cijferige code in")
    .regex(/^\d{6}$/, "Alleen cijfers"),
  wachtwoord,
})

export type InloggenInput = z.infer<typeof inloggenSchema>
export type RegistrerenInput = z.infer<typeof registrerenSchema>
export type OtpInput = z.infer<typeof otpSchema>
export type WachtwoordVergetenInput = z.infer<typeof wachtwoordVergetenSchema>
export type WachtwoordResetInput = z.infer<typeof wachtwoordResetSchema>

export type VoedingInput = z.infer<typeof voedingSchema>
export type LuierInput = z.infer<typeof luierSchema>
export type TemperatuurInput = z.infer<typeof temperatuurSchema>
export type BoertjeInput = z.infer<typeof boertjeSchema>
export type VitamineInput = z.infer<typeof vitamineSchema>
export type MedicatieInput = z.infer<typeof medicatieSchema>
export type NotitieInput = z.infer<typeof notitieSchema>
export type GroeiInput = z.infer<typeof groeiSchema>
export type SlaapInput = z.infer<typeof slaapSchema>
export type HuilInput = z.infer<typeof huilSchema>
export type KolfInput = z.infer<typeof kolfSchema>
export type KindInput = z.infer<typeof kindSchema>