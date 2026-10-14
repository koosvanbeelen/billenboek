import type { z } from "zod"
import { duurInMinuten, inputNaarDatum } from "@/lib/datum"
import type { MappedTable } from "@/lib/db/mappers"
import type { Soort } from "@/lib/types"
import {
  boertjeSchema,
  groeiSchema,
  huilSchema,
  kolfSchema,
  luierSchema,
  medicatieSchema,
  slaapSchema,
  temperatuurSchema,
  vitamineSchema,
  voedingSchema,
} from "@/lib/validations"

// Per soort registratie staat hier alles wat anders is: de tabel, de kolom waarop de dag wordt
// bepaald, de validatie en hoe ingevulde gegevens naar een databaserij gaan. Alles wat voor
// elke soort hetzelfde is (opslaan, bijwerken, verwijderen, de dag ophalen) staat één keer in
// app/actions/registraties.ts. Een nieuwe soort toevoegen = hier één blok erbij, plus een
// tabel en de mapper in lib/db/mappers.ts.

export type SoortConfig = {
  tabel: MappedTable
  tijdkolom: "datum_tijd" | "start"
  schema: z.ZodType<unknown>
  // Gevalideerde invoer -> waarden voor de rij (in camelCase; toDbRow zet ze om naar kolomnamen).
  naarRij: (invoer: any) => Record<string, unknown>
}

function soort<I>(config: {
  tabel: MappedTable
  tijdkolom: "datum_tijd" | "start"
  schema: z.ZodType<I>
  naarRij: (invoer: I) => Record<string, unknown>
}): SoortConfig {
  return config as unknown as SoortConfig
}

const tijdstip = (waarde: string) => inputNaarDatum(waarde).toISOString()

export const SOORTEN: Record<Soort, SoortConfig> = {
  voeding: soort({
    tabel: "voedingen",
    tijdkolom: "datum_tijd",
    schema: voedingSchema,
    naarRij: (d) => ({
      datumTijd: tijdstip(d.datumTijd),
      type: d.type,
      borst: d.type === "borstvoeding" ? d.borst : null,
      duurMinuten: d.type === "borstvoeding" ? d.duurMinuten ?? null : null,
      hoeveelheidMl: d.type !== "borstvoeding" ? d.hoeveelheidMl ?? null : null,
      notitie: d.notitie || null,
    }),
  }),
  luier: soort({
    tabel: "luiers",
    tijdkolom: "datum_tijd",
    schema: luierSchema,
    naarRij: (d) => ({ datumTijd: tijdstip(d.datumTijd), plas: d.plas, poep: d.poep, schoon: d.schoon, notitie: d.notitie || null }),
  }),
  temperatuur: soort({
    tabel: "temperaturen",
    tijdkolom: "datum_tijd",
    schema: temperatuurSchema,
    naarRij: (d) => ({ datumTijd: tijdstip(d.datumTijd), temperatuur: d.temperatuur.toFixed(1) }),
  }),
  boertje: soort({
    tabel: "spugen",
    tijdkolom: "datum_tijd",
    schema: boertjeSchema,
    naarRij: (d) => ({ datumTijd: tijdstip(d.datumTijd), notitie: d.notitie || null }),
  }),
  vitamine: soort({
    tabel: "vitamines",
    tijdkolom: "datum_tijd",
    schema: vitamineSchema,
    naarRij: (d) => ({ datumTijd: tijdstip(d.datumTijd), vitamineK: d.vitamineK, vitamineD: d.vitamineD }),
  }),
  medicatie: soort({
    tabel: "medicatie",
    tijdkolom: "datum_tijd",
    schema: medicatieSchema,
    naarRij: (d) => ({
      datumTijd: tijdstip(d.datumTijd),
      naam: d.naam,
      dosering: d.dosering || null,
      notitie: d.notitie || null,
    }),
  }),
  groei: soort({
    tabel: "groei",
    tijdkolom: "datum_tijd",
    schema: groeiSchema,
    naarRij: (d) => ({
      datumTijd: tijdstip(d.datumTijd),
      gewichtKg: d.gewichtKg !== undefined ? d.gewichtKg.toFixed(2) : null,
      lengteCm: d.lengteCm !== undefined ? d.lengteCm.toFixed(1) : null,
      opmerking: d.opmerking || null,
    }),
  }),
  slapen: soort({
    tabel: "slapen",
    tijdkolom: "start",
    schema: slaapSchema,
    naarRij: (d) => ({
      start: tijdstip(d.start),
      einde: tijdstip(d.einde),
      duurMinuten: duurInMinuten(d.start, d.einde),
      locatie: d.locatie || null,
      notitie: d.notitie || null,
    }),
  }),
  huilen: soort({
    tabel: "huilen",
    tijdkolom: "start",
    schema: huilSchema,
    naarRij: (d) => ({
      start: tijdstip(d.start),
      einde: tijdstip(d.einde),
      duurMinuten: duurInMinuten(d.start, d.einde),
      oorzaak: d.oorzaak || null,
      troost: d.troost || null,
    }),
  }),
  kolven: soort({
    tabel: "kolven",
    tijdkolom: "datum_tijd",
    schema: kolfSchema,
    naarRij: (d) => ({
      datumTijd: tijdstip(d.datumTijd),
      borst: d.borst,
      hoeveelheidMl: d.hoeveelheidMl,
      notitie: d.notitie || null,
    }),
  }),
}

// Volgorde waarin de soorten in de tijdlijn worden samengevoegd (bij gelijke tijd bepaalt deze de volgorde).
export const SOORT_VOLGORDE: Soort[] = [
  "voeding",
  "luier",
  "temperatuur",
  "boertje",
  "vitamine",
  "medicatie",
  "groei",
  "slapen",
  "huilen",
  "kolven",
]
