"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getGebruiker } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { fromDbRow, toDbRow, type MappedTable } from "@/lib/db/mappers"
import { dagGrenzen, datumNaarInput } from "@/lib/datum"
import { dbFout, parseInvoer } from "@/lib/fouten"
import { SOORTEN, SOORT_VOLGORDE } from "@/lib/registratie-soorten"
import type { DagGegevens, Soort, TijdlijnItem } from "@/lib/types"
import type {
  BoertjeInput,
  GroeiInput,
  HuilInput,
  KolfInput,
  LuierInput,
  MedicatieInput,
  SlaapInput,
  TemperatuurInput,
  VitamineInput,
  VoedingInput,
} from "@/lib/validations"

function herlaad() {
  revalidatePath("/")
  revalidatePath("/geschiedenis")
}

async function getOwnedClient() {
  const user = await getGebruiker()
  if (!user) throw new Error("Niet ingelogd")
  const gezinId = await getActiefGezinId()
  const supabase = await createClient()
  return { supabase, user, gezinId }
}

// ---------------------------------------------------------------------------
// Algemene bewerkingen (voor alle soorten hetzelfde)
// ---------------------------------------------------------------------------
async function voegToe(soort: Soort, input: unknown) {
  const { tabel, schema, naarRij } = SOORTEN[soort]
  const invoer = parseInvoer(schema, input, "registraties")
  const { supabase, user, gezinId } = await getOwnedClient()
  const { error } = await supabase
    .from(tabel)
    .insert({ ...toDbRow(tabel, naarRij(invoer)), user_id: user.id, gezin_id: gezinId })
  if (error) throw dbFout("registraties", error)
  herlaad()
}

async function werkBij(soort: Soort, id: number, input: unknown) {
  const { tabel, schema, naarRij } = SOORTEN[soort]
  const invoer = parseInvoer(schema, input, "registraties")
  const { supabase, gezinId } = await getOwnedClient()
  const rij = toDbRow(tabel, { ...naarRij(invoer), bijgewerktOp: new Date().toISOString() })
  const { error } = await supabase.from(tabel).update(rij).eq("id", id).eq("gezin_id", gezinId)
  if (error) throw dbFout("registraties", error)
  herlaad()
}

async function verwijder(soort: Soort, id: number) {
  const { tabel } = SOORTEN[soort]
  const { supabase, gezinId } = await getOwnedClient()
  const { error } = await supabase.from(tabel).delete().eq("id", id).eq("gezin_id", gezinId)
  if (error) throw dbFout("registraties", error)
  herlaad()
}

// ---------------------------------------------------------------------------
// Ophalen van een volledige dag
// ---------------------------------------------------------------------------
export async function getDagGegevens(datum: string): Promise<DagGegevens> {
  const { van, tot } = dagGrenzen(datum)
  const { supabase, gezinId } = await getOwnedClient()

  const dagQuery = async (soort: Soort) => {
    const { tabel, tijdkolom } = SOORTEN[soort]
    const { data, error } = await supabase
      .from(tabel)
      .select("*")
      .eq("gezin_id", gezinId)
      .gte(tijdkolom, van.toISOString())
      .lte(tijdkolom, tot.toISOString())
    if (error) throw dbFout("registraties", error)
    return (data ?? []).map((row) => fromDbRow(tabel, row))
  }

  const laatsteQuery = async (tabel: MappedTable) => {
    const { data, error } = await supabase
      .from(tabel)
      .select("datum_tijd")
      .eq("gezin_id", gezinId)
      .order("datum_tijd", { ascending: false })
      .limit(1)
    if (error) throw dbFout("registraties", error)
    return data ?? []
  }

  // Alle twaalf queries tegelijk, niet na elkaar.
  const [perSoort, laatsteVoedingRij, laatsteLuierRij] = await Promise.all([
    Promise.all(SOORT_VOLGORDE.map(dagQuery)),
    laatsteQuery("voedingen"),
    laatsteQuery("luiers"),
  ])
  const rijen = Object.fromEntries(SOORT_VOLGORDE.map((soort, i) => [soort, perSoort[i]])) as Record<Soort, any[]>

  const items = SOORT_VOLGORDE.flatMap((soort) =>
    rijen[soort].map((record) => ({ soort, id: record.id, datumTijd: record.datumTijd, record }) as TijdlijnItem),
  )
  items.sort((a, b) => a.datumTijd.localeCompare(b.datumTijd))

  const tellers: DagGegevens["tellers"] = {
    voedingenAantal: rijen.voeding.length,
    voedingenMinuten: rijen.voeding.reduce((s, r) => s + (r.duurMinuten ?? 0), 0),
    luiersAantal: rijen.luier.length,
    luiersPoep: rijen.luier.filter((r) => r.poep).length,
    luiersPlas: rijen.luier.filter((r) => r.plas).length,
    laatsteTemperatuur:
      rijen.temperatuur.length > 0
        ? Number(
            [...rijen.temperatuur].sort(
              (a, b) => new Date(b.datumTijd).getTime() - new Date(a.datumTijd).getTime(),
            )[0].temperatuur,
          )
        : null,
    mlGekolfd: rijen.kolven.reduce((s, r) => s + r.hoeveelheidMl, 0),
    slaapMinuten: rijen.slapen.reduce((s, r) => s + r.duurMinuten, 0),
    huilMinuten: rijen.huilen.reduce((s, r) => s + r.duurMinuten, 0),
    laatsteVoeding: laatsteVoedingRij[0] ? datumNaarInput(laatsteVoedingRij[0].datum_tijd) : null,
    laatsteLuier: laatsteLuierRij[0] ? datumNaarInput(laatsteLuierRij[0].datum_tijd) : null,
  }

  return { datum, items, tellers }
}

// ---------------------------------------------------------------------------
// Acties per soort (de namen waarmee de formulieren ze aanroepen)
// ---------------------------------------------------------------------------
export async function voegVoedingToe(input: VoedingInput) { return voegToe("voeding", input) }
export async function werkVoedingBij(id: number, input: VoedingInput) { return werkBij("voeding", id, input) }
export async function verwijderVoeding(id: number) { return verwijder("voeding", id) }

export async function voegLuierToe(input: LuierInput) { return voegToe("luier", input) }
export async function werkLuierBij(id: number, input: LuierInput) { return werkBij("luier", id, input) }
export async function verwijderLuier(id: number) { return verwijder("luier", id) }

export async function voegTemperatuurToe(input: TemperatuurInput) { return voegToe("temperatuur", input) }
export async function werkTemperatuurBij(id: number, input: TemperatuurInput) { return werkBij("temperatuur", id, input) }
export async function verwijderTemperatuur(id: number) { return verwijder("temperatuur", id) }

export async function voegBoertjeToe(input: BoertjeInput) { return voegToe("boertje", input) }
export async function werkBoertjeBij(id: number, input: BoertjeInput) { return werkBij("boertje", id, input) }
export async function verwijderBoertje(id: number) { return verwijder("boertje", id) }
export async function voegSpugenToe(input: BoertjeInput) { return voegToe("boertje", input) }
export async function werkSpugenBij(id: number, input: BoertjeInput) { return werkBij("boertje", id, input) }

export async function voegVitamineToe(input: VitamineInput) { return voegToe("vitamine", input) }
export async function werkVitamineBij(id: number, input: VitamineInput) { return werkBij("vitamine", id, input) }
export async function verwijderVitamine(id: number) { return verwijder("vitamine", id) }

export async function voegMedicatieToe(input: MedicatieInput) { return voegToe("medicatie", input) }
export async function werkMedicatieBij(id: number, input: MedicatieInput) { return werkBij("medicatie", id, input) }
export async function verwijderMedicatie(id: number) { return verwijder("medicatie", id) }

export async function voegGroeiToe(input: GroeiInput) { return voegToe("groei", input) }
export async function werkGroeiBij(id: number, input: GroeiInput) { return werkBij("groei", id, input) }
export async function verwijderGroei(id: number) { return verwijder("groei", id) }

export async function voegSlaapToe(input: SlaapInput) { return voegToe("slapen", input) }
export async function werkSlaapBij(id: number, input: SlaapInput) { return werkBij("slapen", id, input) }
export async function verwijderSlaap(id: number) { return verwijder("slapen", id) }

export async function voegHuilToe(input: HuilInput) { return voegToe("huilen", input) }
export async function werkHuilBij(id: number, input: HuilInput) { return werkBij("huilen", id, input) }
export async function verwijderHuil(id: number) { return verwijder("huilen", id) }

export async function voegKolfToe(input: KolfInput) { return voegToe("kolven", input) }
export async function werkKolfBij(id: number, input: KolfInput) { return werkBij("kolven", id, input) }
export async function verwijderKolf(id: number) { return verwijder("kolven", id) }

// Verwijderen op basis van de soort (gebruikt door de tijdlijnkaarten)
export async function verwijderRegistratie(soort: Soort, id: number) { return verwijder(soort, id) }
