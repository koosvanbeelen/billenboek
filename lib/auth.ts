import { getGebruiker } from "@/lib/supabase/server"

export async function isIngelogd(): Promise<boolean> {
  return Boolean(await getGebruiker())
}

// Alleen interne paden toestaan als doorstuur-doel (voorkomt open redirects).
export function veiligeNext(value: string | null | undefined): string {
  const v = value ?? ""
  return v.startsWith("/") && !v.startsWith("//") ? v : "/"
}
