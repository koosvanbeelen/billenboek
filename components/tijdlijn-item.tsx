"use client"

import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TemperatuurIndicator } from "@/components/temperatuur-indicator"
import { soortMeta } from "@/lib/soorten"
import { formatTijd } from "@/lib/datum"
import type { TijdlijnItem as Item } from "@/lib/types"

function samenvatting(item: Item): React.ReactNode {
  switch (item.soort) {
    case "voeding": {
      const r = item.record
      if (r.type === "borstvoeding") {
        const borst =
          r.borst === "beide" ? "beide borsten" : `${r.borst}er borst`
        return `Borstvoeding · ${borst}${r.duurMinuten ? ` · ${r.duurMinuten} min` : ""}`
      }
      if (r.type === "kolfmelk") {
        return `Gekolfde melk${r.hoeveelheidMl ? ` · ${r.hoeveelheidMl} ml` : ""}`
      }
      return `Kunstvoeding${r.hoeveelheidMl ? ` · ${r.hoeveelheidMl} ml` : ""}`
    }
    case "luier": {
      const r = item.record
      const delen = [
        r.poep && "poep",
        r.plas && "plas",
        r.schoon && "verschoond",
      ].filter(Boolean)
      return delen.join(" + ") || "luier"
    }
    case "temperatuur":
      return <TemperatuurIndicator temperatuur={item.record.temperatuur} />
    case "boertje":
      return item.record.notitie || "Boertje / spugen"
    case "vitamine": {
      const r = item.record
      const delen = [r.vitamineD && "Vitamine D", r.vitamineK && "Vitamine K"].filter(
        Boolean,
      )
      return delen.join(" + ")
    }
    case "medicatie": {
      const r = item.record
      return `${r.naam}${r.dosering ? ` · ${r.dosering}` : ""}`
    }
  }
}

export function TijdlijnItem({
  item,
  onBewerk,
  onVerwijder,
}: {
  item: Item
  onBewerk: () => void
  onVerwijder: () => void
}) {
  const meta = soortMeta[item.soort]
  const Icon = meta.icon

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <span
        className={cn(
          "flex size-10 flex-none items-center justify-center rounded-full",
          meta.kleur,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold tabular-nums text-card-foreground">
            {formatTijd(item.datumTijd)}
          </span>
          <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {meta.label}
          </span>
        </div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {samenvatting(item)}
        </div>
      </div>

      <div className="flex flex-none items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBewerk}
          aria-label="Bewerken"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onVerwijder}
          aria-label="Verwijderen"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
