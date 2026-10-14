"use server"

import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { getActiefKindId } from "@/lib/supabase/kind"
import { vandaagDatum } from "@/lib/datum"
import { fromDbRow, type MappedTable } from "@/lib/db/mappers"
import { SOORTEN } from "@/lib/registratie-soorten"
import { dbFout } from "@/lib/fouten"

export type DagSamenvatting = {
  datum: string // "yyyy-MM-dd"
  voedingenAantal: number
  voedingenMinuten: number
  luiersPoep: number
  luiersPlas: number
  gemiddeldeTemperatuur: number | null
  mlGekolfd: number
  slaapMinuten: number
  huilMinuten: number
}

/**
 * Haalt alle dagen met data op (maximaal 60 dagen terug) voor het gekozen kind.
 * Bouwt een samenvatting per dag met voedingen, luiers en gemiddelde temp.
 */
export async function getGeschiedenis(): Promise<DagSamenvatting[]> {
  const vandaag = vandaagDatum()
  const zestigDagenGeleden = new Date(
    new Date(vandaag).getTime() - 60 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10)
  const vanDatum = new Date(zestigDagenGeleden + "T00:00:00Z")
  const totDatum = new Date(vandaag + "T23:59:59.999Z")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Niet ingelogd")

  const gezinId = await getActiefGezinId()
  const kindId = await getActiefKindId()
  // Let op: slapen en huilen hebben geen "datum_tijd" maar een "start"-kolom. De juiste
  // tijdkolom per tabel staat in SOORTEN (dezelfde bron als getDagGegevens).
  const tijdkolomPerTabel = Object.fromEntries(
    Object.values(SOORTEN).map((s) => [s.tabel, s.tijdkolom]),
  ) as Record<MappedTable, "datum_tijd" | "start">

  const query = async (table: MappedTable): Promise<Record<string, any>[]> => {
    const tijdkolom = tijdkolomPerTabel[table]
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("gezin_id", gezinId)
      .eq("kind_id", kindId)
      .gte(tijdkolom, vanDatum.toISOString())
      .lte(tijdkolom, totDatum.toISOString())
    if (error) throw dbFout("geschiedenis", error)
    return (data ?? []).map((row) => fromDbRow(table, row))
  }

  const [vRows, lRows, tRows, kRows, sRows, hRows] = await Promise.all([
    query("voedingen"),
    query("luiers"),
    query("temperaturen"),
    query("kolven"),
    query("slapen"),
    query("huilen"),
  ])

  // Groepeer per dag
  const perDag = new Map<
    string,
    {
      voedingenAantal: number
      voedingenMinuten: number
      luiersPoep: number
      luiersPlas: number
      temperaturen: number[]
      mlGekolfd: number
      slaapMinuten: number
      huilMinuten: number
    }
  >()

  // Voedingen
  for (const v of vRows) {
    const d = new Date(v.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0,
      voedingenMinuten: 0,
      luiersPoep: 0,
      luiersPlas: 0,
      temperaturen: [],
      mlGekolfd: 0,
      slaapMinuten: 0,
      huilMinuten: 0,
    }
    entry.voedingenAantal++
    if (v.duurMinuten) entry.voedingenMinuten += v.duurMinuten
    perDag.set(d, entry)
  }

  // Luiers
  for (const l of lRows) {
    const d = new Date(l.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0,
      voedingenMinuten: 0,
      luiersPoep: 0,
      luiersPlas: 0,
      temperaturen: [],
      mlGekolfd: 0,
      slaapMinuten: 0,
      huilMinuten: 0,
    }
    if (l.poep) entry.luiersPoep++
    if (l.plas) entry.luiersPlas++
    perDag.set(d, entry)
  }

  // Temperaturen (numeric field wordt als string opgeslagen in Drizzle)
  for (const t of tRows) {
    const d = new Date(t.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0,
      voedingenMinuten: 0,
      luiersPoep: 0,
      luiersPlas: 0,
      temperaturen: [],
      mlGekolfd: 0,
      slaapMinuten: 0,
      huilMinuten: 0,
    }
    const temp = typeof t.temperatuur === "string" 
      ? parseFloat(t.temperatuur) 
      : t.temperatuur
    entry.temperaturen.push(temp)
    perDag.set(d, entry)
  }

  for (const k of kRows) {
    const d = new Date(k.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0, voedingenMinuten: 0, luiersPoep: 0, luiersPlas: 0,
      temperaturen: [], mlGekolfd: 0, slaapMinuten: 0, huilMinuten: 0,
    }
    entry.mlGekolfd += k.hoeveelheidMl ?? 0
    perDag.set(d, entry)
  }

  for (const s of sRows) {
    const d = new Date(s.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0, voedingenMinuten: 0, luiersPoep: 0, luiersPlas: 0,
      temperaturen: [], mlGekolfd: 0, slaapMinuten: 0, huilMinuten: 0,
    }
    entry.slaapMinuten += s.duurMinuten ?? 0
    perDag.set(d, entry)
  }

  for (const h of hRows) {
    const d = new Date(h.datumTijd).toISOString().slice(0, 10)
    const entry = perDag.get(d) ?? {
      voedingenAantal: 0, voedingenMinuten: 0, luiersPoep: 0, luiersPlas: 0,
      temperaturen: [], mlGekolfd: 0, slaapMinuten: 0, huilMinuten: 0,
    }
    entry.huilMinuten += h.duurMinuten ?? 0
    perDag.set(d, entry)
  }

  // Sorteer van nieuw naar oud en zet om naar output
  return Array.from(perDag.entries())
    .sort(([dateA], [dateB]) => (dateB as string).localeCompare(dateA as string))
    .map(([datum, data]) => ({
      datum,
      voedingenAantal: data.voedingenAantal,
      voedingenMinuten: data.voedingenMinuten,
      luiersPoep: data.luiersPoep,
      luiersPlas: data.luiersPlas,
      gemiddeldeTemperatuur:
        data.temperaturen.length > 0
          ? Number(
              (
                data.temperaturen.reduce((a, b) => a + b, 0) /
                data.temperaturen.length
              ).toFixed(1)
            )
          : null,
      mlGekolfd: data.mlGekolfd,
      slaapMinuten: data.slaapMinuten,
      huilMinuten: data.huilMinuten,
    }))
}
