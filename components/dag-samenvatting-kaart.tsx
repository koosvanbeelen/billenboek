"use client"

import Link from "next/link"
import {
  Milk,
  Baby,
  Thermometer,
  ChevronRight,
  Hourglass,
  Layers,
  FlaskConical,
  Moon,
  Frown,
} from "lucide-react"
import { formatDatumLang, formatDuur } from "@/lib/datum"
import { TemperatuurIndicator } from "@/components/temperatuur-indicator"
import type { DagSamenvatting } from "@/app/actions/geschiedenis"
import type { TellerId } from "@/lib/teller-voorkeur"

type Props = {
  dag: DagSamenvatting
  zichtbareTellers: TellerId[]
}

export function DagSamenvattingKaart({ dag, zichtbareTellers }: Props) {
  return (
    <Link
      href={`/geschiedenis?datum=${dag.datum}&detail=true`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm active:bg-primary/5"
    >
      {/* Linker kolom: datum */}
      <div className="min-w-0 flex-shrink-0">
        <div className="text-sm font-bold capitalize text-foreground">
          {formatDatumLang(dag.datum).split(" ").slice(0, 1).join("")}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDatumLang(dag.datum).split(" ").slice(1).join(" ")}
        </div>
      </div>

      {/* Midden kolom: alleen de geselecteerde tellers */}
      <div className="flex flex-1 items-center justify-around gap-2 px-2">
        {zichtbareTellers.includes("voedingenAantal") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Milk className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">
              {dag.voedingenAantal}
            </div>
            <div className="text-xs text-muted-foreground">{dag.voedingenMinuten}m</div>
          </div>
        )}

        {zichtbareTellers.includes("borsttijd") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Hourglass className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{dag.voedingenMinuten}m</div>
            <div className="text-xs text-muted-foreground">borsttijd</div>
          </div>
        )}

        {zichtbareTellers.includes("poepluier") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Baby className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{dag.luiersPoep}</div>
            <div className="text-xs text-muted-foreground">poep</div>
          </div>
        )}

        {zichtbareTellers.includes("plasluier") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Baby className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{dag.luiersPlas}</div>
            <div className="text-xs text-muted-foreground">plas</div>
          </div>
        )}

        {zichtbareTellers.includes("totaalLuiers") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Layers className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{dag.luiersPoep + dag.luiersPlas}</div>
            <div className="text-xs text-muted-foreground">luiers</div>
          </div>
        )}

        {zichtbareTellers.includes("mlGekolfd") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <FlaskConical className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{dag.mlGekolfd}ml</div>
            <div className="text-xs text-muted-foreground">gekolfd</div>
          </div>
        )}

        {zichtbareTellers.includes("totaleSlaaptijd") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Moon className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{formatDuur(dag.slaapMinuten)}</div>
            <div className="text-xs text-muted-foreground">slaap</div>
          </div>
        )}

        {zichtbareTellers.includes("totaleHuiltijd") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Frown className="size-4 text-primary" aria-hidden />
            <div className="text-sm font-bold text-foreground">{formatDuur(dag.huilMinuten)}</div>
            <div className="text-xs text-muted-foreground">huiltijd</div>
          </div>
        )}

        {zichtbareTellers.includes("temperatuur") && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Thermometer
              className={dag.gemiddeldeTemperatuur === null ? "size-4 text-muted-foreground/40" : "size-4 text-primary"}
              aria-hidden
            />
            {dag.gemiddeldeTemperatuur !== null ? (
              <TemperatuurIndicator
                temperatuur={dag.gemiddeldeTemperatuur}
                className="text-xs"
              />
            ) : (
              <div className="text-xs text-muted-foreground/50">—</div>
            )}
          </div>
        )}
      </div>

      {/* Rechter kolom: chevron */}
      <ChevronRight className="size-5 flex-shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
