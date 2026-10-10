"use server"

import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"

export type AppInfo = {
  versie: string
  userId: string | null
  gezinId: string | null
}

export async function laadAppInfo(versie: string): Promise<AppInfo> {
  const supabase = await createClient()
  const [{ data: { user } }, gezinId] = await Promise.all([
    supabase.auth.getUser(),
    getActiefGezinId(),
  ])

  return {
    versie,
    userId: user?.id ?? null,
    gezinId: gezinId ?? null,
  }
}
