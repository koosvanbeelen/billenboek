import { cache } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { GESLACHTEN, KIND_COOKIE, type Geslacht, type Kind } from "@/lib/kinderen"

export const KIND_KOLOMMEN = "id, naam, geboortedatum, geslacht, geboortegewicht_gram"

export function kindVanRij(rij: Record<string, any>): Kind {
  return {
    id: rij.id as string,
    naam: rij.naam as string,
    geboortedatum: (rij.geboortedatum as string | null) ?? null,
    geslacht: GESLACHTEN.includes(rij.geslacht) ? (rij.geslacht as Geslacht) : null,
    geboortegewichtGram: rij.geboortegewicht_gram == null ? null : Number(rij.geboortegewicht_gram),
  }
}

// Fout voor "dit gezin heeft nog geen kind". De (app)-layout vangt dit af door naar de
// stap "kind toevoegen" te sturen; de acties laten het als normale fout doorkomen.
export class GeenKindFout extends Error {
  constructor() {
    super("Voeg eerst een kind toe.")
    this.name = "GeenKindFout"
  }
}

// De kinderen van het gezin van de ingelogde gebruiker, oudste (eerst toegevoegd) eerst.
// Eén keer per verzoek opgehaald. RLS zorgt dat alleen kinderen van het eigen gezin terugkomen.
export const getKinderen = cache(async (): Promise<Kind[]> => {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const { data, error } = await supabase
    .from("kinderen")
    .select(KIND_KOLOMMEN)
    .eq("gezin_id", gezinId)
    .order("aangemaakt_op", { ascending: true })
    .order("id", { ascending: true })
  if (error) throw new Error("Kinderen konden niet worden geladen.")
  return (data ?? []).map(kindVanRij)
})

// Het kind dat nu is gekozen: de waarde uit de cookie als die bij het gezin hoort, anders het
// eerste kind. De cookie wordt nooit blind vertrouwd.
export const getActiefKind = cache(async (): Promise<Kind> => {
  const kinderen = await getKinderen()
  if (kinderen.length === 0) throw new GeenKindFout()
  const opgeslagen = (await cookies()).get(KIND_COOKIE)?.value
  return kinderen.find((k) => k.id === opgeslagen) ?? kinderen[0]
})

export async function getActiefKindId(): Promise<string> {
  return (await getActiefKind()).id
}
