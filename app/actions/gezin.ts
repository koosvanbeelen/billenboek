"use server"

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
}
