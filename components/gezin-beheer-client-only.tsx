"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// useActiveOrganization() uit @neondatabase/auth leunt op een browser-only
// reactieve sessie-store. Next.js rendert client components ook één keer
// server-side (SSR) — daar loopt die hook vast. Door dit onderdeel met
// ssr: false te laden, wordt het uitsluitend in de browser gerenderd.
const GezinBeheerWeergave = dynamic(
  () => import("@/components/gezin-beheer-weergave").then((m) => m.GezinBeheerWeergave),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    ),
  },
)

export function GezinBeheerClientOnly() {
  return <GezinBeheerWeergave />
}
