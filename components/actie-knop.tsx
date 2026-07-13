"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { verstrekenSeconden } from "@/lib/actieve-timer"

function formatVerstreken(seconden: number): string {
  const uren = Math.floor(seconden / 3600)
  const minuten = Math.floor((seconden % 3600) / 60)
  const sec = seconden % 60
  const mm = String(minuten).padStart(2, "0")
  const ss = String(sec).padStart(2, "0")
  return uren > 0 ? `${uren}:${mm}:${ss}` : `${mm}:${ss}`
}

// Grote actieknop met icoon en label. Minimaal 48x48 tikvlak.
//
// Optioneel ondersteunt de knop een lopende timer (voor Slapen/Huilen):
// zolang `actief` waar is, kleurt de knop lichtgroen en toont hij de
// verstreken tijd sinds `sinds` in plaats van het label.
export function ActieKnop({
  label,
  icon: Icon,
  onClick,
  className,
  actief = false,
  sinds = null,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  className?: string
  actief?: boolean
  sinds?: string | null
}) {
  const [verstreken, setVerstreken] = useState(0)

  useEffect(() => {
    if (!actief || !sinds) return
    setVerstreken(verstrekenSeconden(sinds))
    const interval = setInterval(() => {
      setVerstreken(verstrekenSeconden(sinds))
    }, 1000)
    return () => clearInterval(interval)
  }, [actief, sinds])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center shadow-sm transition-colors",
        actief
          ? "border-temp-good/40 bg-temp-good/15"
          : "border-border bg-card hover:bg-accent",
        "active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          actief ? "bg-temp-good/20 text-temp-good" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          actief ? "text-temp-good" : "text-card-foreground",
        )}
      >
        {actief ? formatVerstreken(verstreken) : label}
      </span>
    </button>
  )
}
