"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { kinderen } from "@/lib/db/schema"
import { kindSchema, type KindInput } from "@/lib/validations"

async function getGezinId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
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
