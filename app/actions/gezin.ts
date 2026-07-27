"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { metHuidigGezin } from "@/lib/db/gezin"
import { kinderen } from "@/lib/db/schema"
import { kindSchema, type KindInput } from "@/lib/validations"

// Slaat het (eerste) kind van het zojuist aangemaakte gezin op. Wordt
// aangeroepen direct nadat de organization is aangemaakt en actief gezet via
// authClient.organization.create() + setActive() in de onboarding-flow.
export async function kindAanmaken(input: KindInput) {
  const d = kindSchema.parse(input)
  await metHuidigGezin(async (db) => {
    await db.insert(kinderen).values({
      naam: d.naam,
      geboortedatum: d.geboortedatum || null,
    })
  })
  revalidatePath("/")
}

// Haalt het (eerste) kind van het huidige gezin op. Nu nog altijd het enige
// kind; bij "wisselen van kind" (toekomstige uitbreiding) wordt dit
// uitgebreid met een kindId-parameter.
export async function huidigKindOphalen() {
  return metHuidigGezin(async (db) => {
    const [rij] = await db.select().from(kinderen).limit(1)
    return rij ?? null
  })
}

export async function kindBijwerken(id: number, input: KindInput) {
  const d = kindSchema.parse(input)
  await metHuidigGezin(async (db) => {
    await db
      .update(kinderen)
      .set({ naam: d.naam, geboortedatum: d.geboortedatum || null })
      .where(eq(kinderen.id, id))
  })
  revalidatePath("/instellingen")
}
