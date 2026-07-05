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
  History,
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
import { DatumKiezer } from "@/components/datum-kiezer"
import { verwijderRegistratie } from "@/app/actions/registraties"
import { verschuifDatum, isVandaag, vandaagDatum } from "@/lib/datum"
import type { DagGegevens, Soort, TijdlijnItem as Item } from "@/lib/types"

export function GeschiedenisWeergave({ data }: { data: DagGegevens }) {
  const router = useRouter()
  const [bewerking, setBewerking] = useState<Bewerking | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<Item | null>(null)
  const [bezig, start] = useTransition()

  function ga(datum: string) {
    router.push(`/geschiedenis?datum=${datum}`)
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

  return (
    <div className="flex flex-col gap-5">
      {/* Datumnavigatie: vorige/volgende dag + kalender */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(verschuifDatum(data.datum, -1))}
          aria-label="Vorige dag"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <DatumKiezer waarde={data.datum} maxDatum={vandaagDatum()} onChange={ga} />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => ga(verschuifDatum(data.datum, 1))}
          aria-label="Volgende dag"
          disabled={isVandaag(data.datum)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {!isVandaag(data.datum) && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => ga(vandaagDatum())}
        >
          Terug naar vandaag
        </Button>
      )}

      <DagTellersRij tellers={data.tellers} />

      {/* Ontbrekende registratie alsnog toevoegen voor deze dag */}
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

      {/* Tijdlijn van de gekozen dag */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tijdlijn
        </h2>
        {data.items.length === 0 ? (
          <LegeStatus
            icon={History}
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
