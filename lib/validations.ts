import { z } from "zod"

// datetime-local waarde: "yyyy-MM-ddTHH:mm"
const datumTijd = z
  .string()
  .min(1, "Datum en tijd zijn verplicht")
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Ongeldige datum of tijd")

export const voedingSchema = z
  .object({
    datumTijd,
    type: z.enum(["borstvoeding", "kunstvoeding"]),
    borst: z.enum(["links", "rechts", "beide"]).optional(),
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

export const notitieSchema = z.object({
  notitie: z.string().min(1, "Schrijf eerst iets").max(2000),
})

export type VoedingInput = z.infer<typeof voedingSchema>
export type LuierInput = z.infer<typeof luierSchema>
export type TemperatuurInput = z.infer<typeof temperatuurSchema>
export type BoertjeInput = z.infer<typeof boertjeSchema>
export type VitamineInput = z.infer<typeof vitamineSchema>
export type MedicatieInput = z.infer<typeof medicatieSchema>
export type NotitieInput = z.infer<typeof notitieSchema>
