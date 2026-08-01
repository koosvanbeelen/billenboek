"use server"

import { asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { kinderen } from "@/lib/db/schema"
import { kindSchema, type KindInput } from "@/lib/validations"

async function getGezinId(): Promise<string> {
  const { data: session } = await auth.getSession()
  const gezinId = session?.session?.activeOrganizationId
  if (!gezinId) throw new Error("Geen actief gezin gevonden")
  return gezinId
}

export async function kindAanmaken(input: KindInput) {
  const gezinId = await getGezinId()
  const d = kindSchema.parse(input)
  await db.insert(kinderen).values({
    naam: d.naam,
    geboortedatum: d.geboortedatum || null,
    gezinId: gezinId,
  })
  revalidatePath("/instellingen/account-en-gezin")
}

export async function kinderenOphalen() {
  const gezinId = await getGezinId()
  return db
    .select()
    .from(kinderen)
    .where(eq(kinderen.gezinId, gezinId))
    .orderBy(asc(kinderen.aangemaaktOp))
}
