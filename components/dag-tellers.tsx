"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useZichtbareTellers, type TellerId } from "@/lib/teller-voorkeur"
import { tellerMeta } from "@/lib/tellers"
import { duurInMinuten, formatDuur, formatUuMm, nuInputWaarde } from "@/lib/datum"
import type { DagTellers } from "@/lib/types"
import { useKinderen } from "@/components/kind-provider"
import { useActieveTimer } from "@/lib/actieve-timer"

function Teller({
  icon: Icon,
  waarde,
  label,
}: {
  icon: LucideIcon
  waarde: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className="size-5 text-primary" aria-hidden />
      <span className="text-lg font-bold tabular-nums text-card-foreground">
        {waarde}
      </span>
      <span className="text-xs leading-tight text-muted-foreground">{label}</span>
    </div>
  )
}

// "Tijd sinds..." rekent tegen `nu`, dat elke 30s ververst wordt zodat de
// teller live meeloopt zonder de hele pagina te laten heropbouwen.
function waardeVoorTeller(
  id: TellerId,
  tellers: DagTellers,
  nu: string,
  slaaptNu: boolean,
  nuSlaap: string,
): string {
  switch (id) {
    case "voedingenAantal":
      return String(tellers.voedingenAantal)
    case "borsttijd":
      return `${tellers.voedingenMinuten}m`
    case "poepluier":
      return String(tellers.luiersPoep)
    case "plasluier":
      return String(tellers.luiersPlas)
    case "totaalLuiers":
      return String(tellers.luiersAantal)
    case "temperatuur":
      return tellers.laatsteTemperatuur !== null
        ? `${tellers.laatsteTemperatuur.toFixed(1)}°C`
        : "—"
    case "tijdSindsVoeding":
      return tellers.laatsteVoeding
        ? formatUuMm(duurInMinuten(tellers.laatsteVoeding, nu))
        : "—"
    case "tijdSindsLuier":
      return tellers.laatsteLuier
        ? formatUuMm(duurInMinuten(tellers.laatsteLuier, nu))
        : "—"
    case "tijdSindsSlaap":
      // Tijdens een lopende slaaptimer is er geen "tijd sinds": het kind slaapt.
      if (slaaptNu) return "Slaapt"
      return tellers.laatsteSlaapEinde
        ? formatUuMm(duurInMinuten(tellers.laatsteSlaapEinde, nuSlaap))
        : "—"
    case "mlGekolfd":
      return `${tellers.mlGekolfd}ml`
    case "totaleSlaaptijd":
      return formatDuur(tellers.slaapMinuten)
    case "totaleHuiltijd":
      return formatDuur(tellers.huilMinuten)
  }
}

const kolomKlasse: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
}

export function DagTellersRij({ tellers }: { tellers: DagTellers }) {
  const [zichtbaar] = useZichtbareTellers()
  const [nu, setNu] = useState(() => nuInputWaarde())
  // "Tijd sinds laatste slaap" ververst bewust maar elke 5 minuten.
  const [nuSlaap, setNuSlaap] = useState(() => nuInputWaarde())
  const { actiefKind } = useKinderen()
  const slaapTimer = useActieveTimer("slapen", actiefKind.id)

  useEffect(() => {
    const interval = setInterval(() => setNu(nuInputWaarde()), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNuSlaap(nuInputWaarde()), 300_000)
    return () => clearInterval(interval)
  }, [])

  // Een geïnstalleerde app (vooral op iPhone) pauzeert timers zodra hij op de
  // achtergrond staat. Bij terugkeren rekenen we daarom meteen opnieuw, in
  // plaats van te wachten op de volgende interval-tik.
  useEffect(() => {
    function opTerugkeer() {
      if (document.visibilityState === "hidden") return
      const nuNu = nuInputWaarde()
      setNu(nuNu)
      setNuSlaap(nuNu)
    }
    document.addEventListener("visibilitychange", opTerugkeer)
    window.addEventListener("focus", opTerugkeer)
    window.addEventListener("pageshow", opTerugkeer)
    return () => {
      document.removeEventListener("visibilitychange", opTerugkeer)
      window.removeEventListener("focus", opTerugkeer)
      window.removeEventListener("pageshow", opTerugkeer)
    }
  }, [])

  if (zichtbaar.length === 0) return null

  return (
    <div className={cn("grid gap-2", kolomKlasse[zichtbaar.length] ?? "grid-cols-4")}>
      {zichtbaar.map((id) => {
        const meta = tellerMeta[id]
        return (
          <Teller
            key={id}
            icon={meta.icon}
            waarde={waardeVoorTeller(id, tellers, nu, slaapTimer.status === "lopend", nuSlaap)}
            label={meta.label}
          />
        )
      })}
    </div>
  )
}
