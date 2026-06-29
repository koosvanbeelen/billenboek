import { Milk, Baby, Clock, Droplet } from "lucide-react"
import type { DagTellers } from "@/lib/types"

function Teller({
  icon: Icon,
  waarde,
  label,
}: {
  icon: typeof Milk
  waarde: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className="size-5 text-primary" aria-hidden />
      <span className="text-lg font-bold tabular-nums text-card-foreground">
        {waarde}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function DagTellersRij({ tellers }: { tellers: DagTellers }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Teller icon={Milk} waarde={String(tellers.voedingenAantal)} label="Voedingen" />
      <Teller
        icon={Clock}
        waarde={`${tellers.voedingenMinuten}m`}
        label="Borsttijd"
      />
      <Teller icon={Baby} waarde={String(tellers.luiersPoep)} label="Poep" />
      <Teller icon={Droplet} waarde={String(tellers.luiersPlas)} label="Plas" />
    </div>
  )
}
