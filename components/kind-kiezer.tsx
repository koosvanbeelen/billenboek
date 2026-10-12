"use client"

import { cn } from "@/lib/utils"
import { useKinderen } from "@/components/kind-provider"

function Avatar({ naam, actief }: { naam: string; actief: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        actief ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary",
      )}
    >
      {naam.trim().charAt(0).toUpperCase() || "?"}
    </span>
  )
}

// Kindkiezer bovenaan Vandaag en Geschiedenis (boven de datumkiezer). Verschijnt alleen als het
// gezin meer dan één kind heeft; met één kind valt er niets te kiezen.
export function KindKiezer({ className }: { className?: string }) {
  const { kinderen, actiefKind, kiesKind } = useKinderen()
  if (kinderen.length < 2) return null

  return (
    <div role="radiogroup" aria-label="Kind" className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      {kinderen.map((kind) => {
        const actief = kind.id === actiefKind.id
        return (
          <button
            key={kind.id}
            type="button"
            role="radio"
            aria-checked={actief}
            onClick={() => void kiesKind(kind.id)}
            className={cn(
              "flex h-12 min-w-24 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-base font-medium transition-colors",
              actief
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-card-foreground hover:bg-accent",
            )}
          >
            <Avatar naam={kind.naam} actief={actief} />
            <span className="max-w-28 truncate">{kind.naam}</span>
          </button>
        )
      })}
    </div>
  )
}
