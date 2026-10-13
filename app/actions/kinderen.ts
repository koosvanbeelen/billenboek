"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { KIND_KOLOMMEN, kindVanRij } from "@/lib/supabase/kind"
import { isKindId, KIND_COOKIE, kindSchema, type Kind, type KindInvoer } from "@/lib/kinderen"
import { eersteFout, type Uitkomst } from "@/lib/account-validatie"
import { logFout } from "@/lib/fouten"

const MAX_KINDEREN = 10
const EEN_JAAR = 60 * 60 * 24 * 365

// Gevalideerde formulierinvoer -> kolommen van de tabel `kinderen`.
function naarRij(invoer: ReturnType<typeof kindSchema.parse>) {
  return {
    naam: invoer.naam,
    geboortedatum: invoer.geboortedatum || null,
    geslacht: invoer.geslacht || null,
    geboortegewicht_gram: invoer.geboortegewichtGram ? Number(invoer.geboortegewichtGram) : null,
  }
}

function herlaad() {
  // Layout, want de kinderlijst en de kindkiezer staan in de layout.
  revalidatePath("/", "layout")
}

export async function voegKindToe(invoer: KindInvoer): Promise<Uitkomst<{ kind: Kind }>> {
  const parsed = kindSchema.safeParse(invoer)
  if (!parsed.success) return { ok: false, fout: eersteFout(parsed.error) }

  const supabase = await createClient()
  const gezinId = await getActiefGezinId()

  const { count, error: telFout } = await supabase
    .from("kinderen")
    .select("id", { count: "exact", head: true })
    .eq("gezin_id", gezinId)
  if (telFout) {
    logFout("kinderen.voegKindToe", telFout.message)
    return { ok: false, fout: "Kind toevoegen lukt niet. Probeer het opnieuw." }
  }
  if ((count ?? 0) >= MAX_KINDEREN) {
    return { ok: false, fout: `Je kunt maximaal ${MAX_KINDEREN} kinderen toevoegen.` }
  }

  const { data, error } = await supabase
    .from("kinderen")
    .insert({ ...naarRij(parsed.data), gezin_id: gezinId })
    .select(KIND_KOLOMMEN)
    .single()
  if (error || !data) {
    logFout("kinderen.voegKindToe", error?.message ?? "geen rij teruggekregen")
    return { ok: false, fout: "Kind toevoegen lukt niet. Probeer het opnieuw." }
  }

  herlaad()
  return { ok: true, kind: kindVanRij(data) }
}

export async function werkKindBij(id: string, invoer: KindInvoer): Promise<Uitkomst> {
  const parsed = kindSchema.safeParse(invoer)
  if (!parsed.success) return { ok: false, fout: eersteFout(parsed.error) }
  if (!isKindId(id)) return { ok: false, fout: "Onbekend kind." }

  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const { data, error } = await supabase
    .from("kinderen")
    .update({ ...naarRij(parsed.data), bijgewerkt_op: new Date().toISOString() })
    .eq("id", id)
    .eq("gezin_id", gezinId)
    .select("id")
  if (error) {
    logFout("kinderen.werkKindBij", error.message)
    return { ok: false, fout: "Opslaan lukt niet. Probeer het opnieuw." }
  }
  if (!data || data.length === 0) return { ok: false, fout: "Dit kind bestaat niet (meer)." }

  herlaad()
  return { ok: true }
}

// Verwijdert het kind én alle registraties van dat kind (foreign key met on delete cascade).
// Het laatste kind van een gezin kan niet worden verwijderd.
export async function verwijderKind(id: string): Promise<Uitkomst> {
  if (!isKindId(id)) return { ok: false, fout: "Onbekend kind." }

  const supabase = await createClient()
  const gezinId = await getActiefGezinId()

  const { count, error: telFout } = await supabase
    .from("kinderen")
    .select("id", { count: "exact", head: true })
    .eq("gezin_id", gezinId)
  if (telFout) {
    logFout("kinderen.verwijderKind", telFout.message)
    return { ok: false, fout: "Verwijderen lukt niet. Probeer het opnieuw." }
  }
  if ((count ?? 0) <= 1) return { ok: false, fout: "Er moet minimaal één kind overblijven." }

  const { data, error } = await supabase
    .from("kinderen")
    .delete()
    .eq("id", id)
    .eq("gezin_id", gezinId)
    .select("id")
  if (error) {
    logFout("kinderen.verwijderKind", error.message)
    return { ok: false, fout: "Verwijderen lukt niet. Probeer het opnieuw." }
  }
  if (!data || data.length === 0) return { ok: false, fout: "Dit kind bestaat niet (meer)." }

  // Stond dit kind gekozen? Dan valt de app vanzelf terug op het eerste kind.
  const cookieStore = await cookies()
  if (cookieStore.get(KIND_COOKIE)?.value === id) cookieStore.delete(KIND_COOKIE)

  herlaad()
  return { ok: true }
}

// Onthoudt welk kind is gekozen. De registratie-acties lezen dit op de server, zodat de
// formulieren niet hoeven te weten welk kind actief is.
export async function zetActiefKind(id: string): Promise<Uitkomst> {
  if (!isKindId(id)) return { ok: false, fout: "Onbekend kind." }

  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const { data, error } = await supabase
    .from("kinderen")
    .select("id")
    .eq("id", id)
    .eq("gezin_id", gezinId)
    .maybeSingle()
  if (error) {
    logFout("kinderen.zetActiefKind", error.message)
    return { ok: false, fout: "Wisselen lukt niet. Probeer het opnieuw." }
  }
  if (!data) return { ok: false, fout: "Dit kind bestaat niet (meer)." }

  const cookieStore = await cookies()
  cookieStore.set(KIND_COOKIE, String(id), {
    path: "/",
    maxAge: EEN_JAAR,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // de client leest 'm om wisselingen in een ander tabblad te merken
  })
  return { ok: true }
}
