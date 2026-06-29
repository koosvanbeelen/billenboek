"use server"

import { and, eq, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  boertjesSpugen,
  luiers,
  medicatie,
  temperaturen,
  vitamines,
  voedingen,
} from "@/lib/db/schema"
import { dagGrenzen, inputNaarDatum } from "@/lib/datum"
import type {
  BoertjeItem,
  DagGegevens,
  LuierItem,
  MedicatieItem,
  TemperatuurItem,
  TijdlijnItem,
  VitamineItem,
  VoedingItem,
} from "@/lib/types"
import {
  boertjeSchema,
  luierSchema,
  medicatieSchema,
  temperatuurSchema,
  vitamineSchema,
  voedingSchema,
  type BoertjeInput,
  type LuierInput,
  type MedicatieInput,
  type TemperatuurInput,
  type VitamineInput,
  type VoedingInput,
} from "@/lib/validations"

function herlaad() {
  revalidatePath("/")
  revalidatePath("/geschiedenis")
}

const iso = (d: Date) => d.toISOString()

// ---------------------------------------------------------------------------
// Ophalen van een volledige dag
// ---------------------------------------------------------------------------
export async function getDagGegevens(datum: string): Promise<DagGegevens> {
  const { van, tot } = dagGrenzen(datum)

  const binnen = (kolom: typeof voedingen.datumTijd) =>
    and(gte(kolom, van), lte(kolom, tot))

  const [vRows, lRows, tRows, bRows, viRows, mRows] = await Promise.all([
    db.select().from(voedingen).where(binnen(voedingen.datumTijd)),
    db.select().from(luiers).where(binnen(luiers.datumTijd)),
    db.select().from(temperaturen).where(binnen(temperaturen.datumTijd)),
    db.select().from(boertjesSpugen).where(binnen(boertjesSpugen.datumTijd)),
    db.select().from(vitamines).where(binnen(vitamines.datumTijd)),
    db.select().from(medicatie).where(binnen(medicatie.datumTijd)),
  ])

  const items: TijdlijnItem[] = []

  for (const r of vRows) {
    items.push({
      soort: "voeding",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        type: r.type as VoedingItem["type"],
        borst: r.borst as VoedingItem["borst"],
        duurMinuten: r.duurMinuten,
        hoeveelheidMl: r.hoeveelheidMl,
        notitie: r.notitie,
      },
    })
  }
  for (const r of lRows) {
    items.push({
      soort: "luier",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        plas: r.plas,
        poep: r.poep,
        schoon: r.schoon,
      } satisfies LuierItem,
    })
  }
  for (const r of tRows) {
    items.push({
      soort: "temperatuur",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        temperatuur: Number(r.temperatuur),
      } satisfies TemperatuurItem,
    })
  }
  for (const r of bRows) {
    items.push({
      soort: "boertje",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        notitie: r.notitie,
      } satisfies BoertjeItem,
    })
  }
  for (const r of viRows) {
    items.push({
      soort: "vitamine",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        vitamineK: r.vitamineK,
        vitamineD: r.vitamineD,
      } satisfies VitamineItem,
    })
  }
  for (const r of mRows) {
    items.push({
      soort: "medicatie",
      id: r.id,
      datumTijd: iso(r.datumTijd),
      record: {
        id: r.id,
        datumTijd: iso(r.datumTijd),
        naam: r.naam,
        dosering: r.dosering,
        notitie: r.notitie,
      } satisfies MedicatieItem,
    })
  }

  items.sort((a, b) => a.datumTijd.localeCompare(b.datumTijd))

  const tellers = {
    voedingenAantal: vRows.length,
    voedingenMinuten: vRows.reduce((s, r) => s + (r.duurMinuten ?? 0), 0),
    luiersPoep: lRows.filter((r) => r.poep).length,
    luiersPlas: lRows.filter((r) => r.plas).length,
  }

  return { datum, items, tellers }
}

// ---------------------------------------------------------------------------
// Voeding
// ---------------------------------------------------------------------------
export async function voegVoedingToe(input: VoedingInput) {
  const d = voedingSchema.parse(input)
  await db.insert(voedingen).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    type: d.type,
    borst: d.type === "borstvoeding" ? d.borst : null,
    duurMinuten: d.type === "borstvoeding" ? d.duurMinuten ?? null : null,
    hoeveelheidMl: d.type === "kunstvoeding" ? d.hoeveelheidMl ?? null : null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkVoedingBij(id: number, input: VoedingInput) {
  const d = voedingSchema.parse(input)
  await db
    .update(voedingen)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      type: d.type,
      borst: d.type === "borstvoeding" ? d.borst : null,
      duurMinuten: d.type === "borstvoeding" ? d.duurMinuten ?? null : null,
      hoeveelheidMl: d.type === "kunstvoeding" ? d.hoeveelheidMl ?? null : null,
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(voedingen.id, id))
  herlaad()
}

export async function verwijderVoeding(id: number) {
  await db.delete(voedingen).where(eq(voedingen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Luier
// ---------------------------------------------------------------------------
export async function voegLuierToe(input: LuierInput) {
  const d = luierSchema.parse(input)
  await db.insert(luiers).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    plas: d.plas,
    poep: d.poep,
    schoon: d.schoon,
  })
  herlaad()
}

export async function werkLuierBij(id: number, input: LuierInput) {
  const d = luierSchema.parse(input)
  await db
    .update(luiers)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      plas: d.plas,
      poep: d.poep,
      schoon: d.schoon,
      bijgewerktOp: new Date(),
    })
    .where(eq(luiers.id, id))
  herlaad()
}

export async function verwijderLuier(id: number) {
  await db.delete(luiers).where(eq(luiers.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Temperatuur
// ---------------------------------------------------------------------------
export async function voegTemperatuurToe(input: TemperatuurInput) {
  const d = temperatuurSchema.parse(input)
  await db.insert(temperaturen).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    temperatuur: d.temperatuur.toFixed(1),
  })
  herlaad()
}

export async function werkTemperatuurBij(id: number, input: TemperatuurInput) {
  const d = temperatuurSchema.parse(input)
  await db
    .update(temperaturen)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      temperatuur: d.temperatuur.toFixed(1),
      bijgewerktOp: new Date(),
    })
    .where(eq(temperaturen.id, id))
  herlaad()
}

export async function verwijderTemperatuur(id: number) {
  await db.delete(temperaturen).where(eq(temperaturen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Boertje / Spugen
// ---------------------------------------------------------------------------
export async function voegBoertjeToe(input: BoertjeInput) {
  const d = boertjeSchema.parse(input)
  await db.insert(boertjesSpugen).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkBoertjeBij(id: number, input: BoertjeInput) {
  const d = boertjeSchema.parse(input)
  await db
    .update(boertjesSpugen)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(boertjesSpugen.id, id))
  herlaad()
}

export async function verwijderBoertje(id: number) {
  await db.delete(boertjesSpugen).where(eq(boertjesSpugen.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Vitamines
// ---------------------------------------------------------------------------
export async function voegVitamineToe(input: VitamineInput) {
  const d = vitamineSchema.parse(input)
  await db.insert(vitamines).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    vitamineK: d.vitamineK,
    vitamineD: d.vitamineD,
  })
  herlaad()
}

export async function werkVitamineBij(id: number, input: VitamineInput) {
  const d = vitamineSchema.parse(input)
  await db
    .update(vitamines)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      vitamineK: d.vitamineK,
      vitamineD: d.vitamineD,
      bijgewerktOp: new Date(),
    })
    .where(eq(vitamines.id, id))
  herlaad()
}

export async function verwijderVitamine(id: number) {
  await db.delete(vitamines).where(eq(vitamines.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Medicatie
// ---------------------------------------------------------------------------
export async function voegMedicatieToe(input: MedicatieInput) {
  const d = medicatieSchema.parse(input)
  await db.insert(medicatie).values({
    datumTijd: inputNaarDatum(d.datumTijd),
    naam: d.naam,
    dosering: d.dosering || null,
    notitie: d.notitie || null,
  })
  herlaad()
}

export async function werkMedicatieBij(id: number, input: MedicatieInput) {
  const d = medicatieSchema.parse(input)
  await db
    .update(medicatie)
    .set({
      datumTijd: inputNaarDatum(d.datumTijd),
      naam: d.naam,
      dosering: d.dosering || null,
      notitie: d.notitie || null,
      bijgewerktOp: new Date(),
    })
    .where(eq(medicatie.id, id))
  herlaad()
}

export async function verwijderMedicatie(id: number) {
  await db.delete(medicatie).where(eq(medicatie.id, id))
  herlaad()
}

// ---------------------------------------------------------------------------
// Algemene verwijderfunctie op basis van soort
// ---------------------------------------------------------------------------
export async function verwijderRegistratie(
  soort:
    | "voeding"
    | "luier"
    | "temperatuur"
    | "boertje"
    | "vitamine"
    | "medicatie",
  id: number,
) {
  switch (soort) {
    case "voeding":
      await db.delete(voedingen).where(eq(voedingen.id, id))
      break
    case "luier":
      await db.delete(luiers).where(eq(luiers.id, id))
      break
    case "temperatuur":
      await db.delete(temperaturen).where(eq(temperaturen.id, id))
      break
    case "boertje":
      await db.delete(boertjesSpugen).where(eq(boertjesSpugen.id, id))
      break
    case "vitamine":
      await db.delete(vitamines).where(eq(vitamines.id, id))
      break
    case "medicatie":
      await db.delete(medicatie).where(eq(medicatie.id, id))
      break
  }
  herlaad()
}
