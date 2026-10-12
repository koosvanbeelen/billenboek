"use server"

import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { getKinderen } from "@/lib/supabase/kind"

export type AppInfo = {
  versie: string
  userId: string | null
  gezinId: string | null
  kinderen: { id: number; naam: string }[]
}

export async function laadAppInfo(versie: string): Promise<AppInfo> {
  const supabase = await createClient()
  const [{ data: { user } }, gezinId, kinderen] = await Promise.all([
    supabase.auth.getUser(),
    getActiefGezinId(),
    getKinderen(),
  ])

  return {
    versie,
    userId: user?.id ?? null,
    gezinId: gezinId ?? null,
    kinderen: kinderen.map((kind) => ({ id: kind.id, naam: kind.naam })),
  }
}
