"use server"

import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { metHuidigGezin } from "@/lib/db/gezin"
import { notities } from "@/lib/db/schema"
import { toggleCheckboxRegel } from "@/lib/notitie-opmaak"
import type { NotitieItem } from "@/lib/types"
import { notitieSchema } from "@/lib/validations"

export async function getNotities(): Promise<NotitieItem[]> {
  return metHuidigGezin(async (db) => {
    const rows = await db
      .select()
      .from(notities)
      .orderBy(desc(notities.datumTijd))
    return rows.map((r) => ({
      id: r.id,
      datumTijd: r.datumTijd.toISOString(),
      notitie: r.notitie,
    }))
  })
}

export async function voegNotitieToe(input: { notitie: string }) {
  const d = notitieSchema.parse(input)
  await metHuidigGezin(async (db) => {
    await db.insert(notities).values({ notitie: d.notitie })
  })
  revalidatePath("/notities")
}

export async function werkNotitieBij(id: number, input: { notitie: string }) {
  const d = notitieSchema.parse(input)
  await metHuidigGezin(async (db) => {
    await db
      .update(notities)
      .set({ notitie: d.notitie })
      .where(eq(notities.id, id))
  })
  revalidatePath("/notities")
}

export async function verwijderNotitie(id: number) {
  await metHuidigGezin(async (db) => {
    await db.delete(notities).where(eq(notities.id, id))
  })
  revalidatePath("/notities")
}

// Vinkt één checklist-regel binnen een notitie aan/uit. Leest de actuele
// tekst eerst opnieuw uit de database (in plaats van de tekst vanuit de
// client mee te sturen), zodat een wijziging van de andere ouder niet
// per ongeluk overschreven wordt.
export async function vinkNotitieRegelAf(id: number, regelIndex: number) {
  await metHuidigGezin(async (db) => {
    const [rij] = await db
      .select()
      .from(notities)
      .where(eq(notities.id, id))
      .limit(1)
    if (!rij) return

    const nieuweTekst = toggleCheckboxRegel(rij.notitie, regelIndex)
    await db.update(notities).set({ notitie: nieuweTekst }).where(eq(notities.id, id))
  })
  revalidatePath("/notities")
}
