"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Milk,
  Baby,
  Thermometer,
  Wind,
  Sparkles,
  Pill,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ActieKnop } from "@/components/actie-knop"
import { DagTellersRij } from "@/components/dag-tellers"
import { TijdlijnItem } from "@/components/tijdlijn-item"
import { LegeStatus } from "@/components/lege-status"
import { BevestigDialog } from "@/components/bevestig-dialog"
import {
  RegistratieDialog,
  type Bewerking,
} from "@/components/registratie-dialog"
import { DagSamenvattingKaart } from "@/components/dag-samenvatting-kaart"
import { verwijderRegistratie } from "@/app/actions/registraties"
import { getGeschiedenis } from "@/app/actions/geschiedenis"
import { verschuifDatum, isVandaag, vandaagDatum, formatDatumLang } from "@/lib/datum"
import type { DagGegevens, Soort, TijdlijnItem as Item } from "@/lib/types"

type Props = {
  data: DagGegevens
  dag: string
  toonDetail: boolean
}

export function GeschiedenisWeergave({ data, dag, toonDetail }: Props) {
  const router = useRouter()
  const [bewerking, setBewerking] = useState<Bewerking | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<Item | null>(null)
  const [samenvattingen, setSamenvattingen] = useState<
    Awaited<ReturnType<typeof getGeschiedenis>> | null
  >(null)
  const [bezig, start] = useTransition()

  // Bij mount: haal samenvattingen op als we in lijstweergave zijn
  const [mounted, setMounted] = useState(false)
  if (!mounted && !toonDetail) {
    setMounted(true)
    start(async () => {
      try {
        const s = await getGeschiedenis()
        setSamenvattingen(s)
      } catch {
        toast.error("Kon geschiedenis niet laden")
      }
    })
  }

  function gaTerug() {
    if (toonDetail) {
      router.push("/geschiedenis")
    }
  }

  function ga(dagen: number) {
    router.push(`/geschiedenis?datum=${verschuifDatum(dag, dagen)}&detail=true`)
  }

  function nieuw(soort: Soort) {
    setBewerking({ soort } as Bewerking)
  }

  function bewerk(item: Item) {
    setBewerking({ soort: item.soort, record: item.record } as Bewerking)
  }

  function bevestigVerwijderen() {
    if (!teVerwijderen) return
    const item = teVerwijderen
    setTeVerwijderen(null)
    start(async () => {
      try {
        await verwijderRegistratie(item.soort, item.id)
        toast.success("Verwijderd")
        router.refresh()
      } catch {
        toast.error("Verwijderen mislukt")
      }
    })
  }

  // ===== LIJSTWEERGAVE (standaard): dagsamenvattingen =====
  if (!toonDetail) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Geschiedenis
        </h1>

        {samenvattingen && samenvattingen.length === 0 ? (
          <LegeStatus
            icon={Calendar}
            titel="Nog geen registraties"
            beschrijving="Voeg registraties toe in het tabblad 'Vandaag'."
          />
        ) : samenvattingen ? (
          <div className={bezig ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"}>
            {samenvattingen.map((s) => (
              <DagSamenvattingKaart key={s.datum} dag={s} />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Bezig met laden...
          </div>
        )}
      </div>
    )
  }

  // ===== DETAILWEERGAVE: dezelfde als Vandaag (tijdlijn + bewerken/verwijderen) =====
  return (
    <div className="flex flex-col gap-5">
      {/* Terug naar lijstweergave */}
      <Button
        variant="ghost"
        size="sm"
        onClick={gaTerug}
        className="w-fit"
      >
        <ChevronLeft className="size-4" data-icon="inline-start" />
        Terug
      </Button>

      {/* Datumnavigatie */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(-1)}
          aria-label="Vorige dag"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div className="text-center">
          <p className="font-heading text-base font-semibold capitalize text-foreground">
            {isVandaag(dag) ? "Vandaag" : formatDatumLang(dag).split(" ")[0]}
          </p>
          <p className="text-xs text-muted-foreground">{formatDatumLang(dag)}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(1)}
          aria-label="Volgende dag"
          disabled={isVandaag(dag)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <DagTellersRij tellers={data.tellers} />

      {/* Actieknoppen voor deze dag */}
      <div className="grid grid-cols-3 gap-2">
        <ActieKnop label="Voeding" icon={Milk} onClick={() => nieuw("voeding")} />
        <ActieKnop label="Luier" icon={Baby} onClick={() => nieuw("luier")} />
        <ActieKnop
          label="Temperatuur"
          icon={Thermometer}
          onClick={() => nieuw("temperatuur")}
        />
        <ActieKnop label="Boertje" icon={Wind} onClick={() => nieuw("boertje")} />
        <ActieKnop label="Vitamine" icon={Sparkles} onClick={() => nieuw("vitamine")} />
        <ActieKnop label="Medicatie" icon={Pill} onClick={() => nieuw("medicatie")} />
      </div>

      {/* Tijdlijn */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tijdlijn
        </h2>
        {data.items.length === 0 ? (
          <LegeStatus
            icon={Calendar}
            titel="Niks geregistreerd"
            beschrijving="Voor deze dag zijn nog geen registraties toegevoegd."
          />
        ) : (
          <div
            className={
              bezig ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"
            }
          >
            {data.items.map((item) => (
              <TijdlijnItem
                key={`${item.soort}-${item.id}`}
                item={item}
                onBewerk={() => bewerk(item)}
                onVerwijder={() => setTeVerwijderen(item)}
              />
            ))}
          </div>
        )}
      </section>

      <RegistratieDialog
        bewerking={bewerking}
        onClose={() => {
          setBewerking(null)
          router.refresh()
        }}
      />

      <BevestigDialog
        open={teVerwijderen !== null}
        onOpenChange={(o) => !o && setTeVerwijderen(null)}
        titel="Registratie verwijderen?"
        beschrijving="Dit kan niet ongedaan worden gemaakt."
        onBevestig={bevestigVerwijderen}
      />
    </div>
  )
}
