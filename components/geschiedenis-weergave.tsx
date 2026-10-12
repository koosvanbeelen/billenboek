"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TijdlijnItem } from "@/components/tijdlijn-item"
import { LegeStatus } from "@/components/lege-status"
import { BevestigDialog } from "@/components/bevestig-dialog"
import {
  RegistratieDialog,
  type Bewerking,
} from "@/components/registratie-dialog"
import { DagSamenvattingKaart } from "@/components/dag-samenvatting-kaart"
import { KindKiezer } from "@/components/kind-kiezer"
import { useKinderen } from "@/components/kind-provider"
import { useTijdlijnVolgorde } from "@/lib/tijdlijn-voorkeur"
import {
  ALLE_TELLERS,
  MAX_TELLERS,
  useZichtbareTellers,
  type TellerId,
} from "@/lib/teller-voorkeur"
import { tellerMeta } from "@/lib/tellers"
import { verwijderRegistratie } from "@/app/actions/registraties"
import { getGeschiedenis } from "@/app/actions/geschiedenis"
import { verschuifDatum, isVandaag, formatDatumLang } from "@/lib/datum"
import type { DagGegevens, Soort, TijdlijnItem as Item } from "@/lib/types"

type Props = {
  data: DagGegevens
  dag: string
  toonDetail: boolean
}

export function GeschiedenisWeergave({ data, dag, toonDetail }: Props) {
  const router = useRouter()
  const [bewerking, setBewerking] = useState<Bewerking | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<{
    soort: Soort
    id: number
  } | null>(null)
  const [samenvattingen, setSamenvattingen] = useState<
    Awaited<ReturnType<typeof getGeschiedenis>> | null
  >(null)
  const [bezig, start] = useTransition()
  const [volgorde] = useTijdlijnVolgorde()
  const [zichtbareTellers, zetTeller] = useZichtbareTellers()
  const { actiefKind } = useKinderen()
  const geschiedenisTellers: TellerId[] = ALLE_TELLERS.filter(
    (id) => id !== "tijdSindsVoeding" && id !== "tijdSindsLuier",
  )
  const zichtbareGeschiedenisTellers = zichtbareTellers.filter((id) =>
    geschiedenisTellers.includes(id),
  )

  function wijzigTellers(waarden: string[]) {
    const gekozen = waarden as TellerId[]
    if (gekozen.length > MAX_TELLERS) {
      toast.error(`Je kunt maximaal ${MAX_TELLERS} tellers selecteren`)
      return
    }
    const geselecteerd = new Set(gekozen)
    for (const id of geschiedenisTellers) {
      if (geselecteerd.has(id) !== zichtbareTellers.includes(id)) {
        zetTeller(id, geselecteerd.has(id))
      }
    }
  }

  // Respecteer dezelfde tijdlijn-voorkeur als "Vandaag" (in te stellen via
  // Instellingen).
  const items = useMemo(() => {
    const teken = volgorde === "oud-nieuw" ? 1 : -1
    return [...data.items].sort(
      (a, b) =>
        teken *
        (new Date(a.datumTijd).getTime() - new Date(b.datumTijd).getTime()),
    )
  }, [data.items, volgorde])

  // Bij mount: haal samenvattingen op als we in lijstweergave zijn
  useEffect(() => {
    if (toonDetail) return
    let actief = true
    setSamenvattingen(null)
    start(async () => {
      try {
        const s = await getGeschiedenis()
        if (actief) setSamenvattingen(s)
      } catch {
        if (actief) toast.error("Kon geschiedenis niet laden")
      }
    })
    return () => {
      actief = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toonDetail, actiefKind.id])

  function gaTerug() {
    if (toonDetail) {
      router.push("/geschiedenis")
    }
  }

  function ga(dagen: number) {
    router.push(`/geschiedenis?datum=${verschuifDatum(dag, dagen)}&detail=true`)
  }

  function bewerk(item: Item) {
    setBewerking({ soort: item.soort, record: item.record } as Bewerking)
  }

  // Verwijderen start vanuit het bewerkformulier (in RegistratieDialog): het
  // formulier sluit direct, en de bestaande bevestigingsstap opent daarna.
  function verwijderVanuitFormulier() {
    if (!bewerking?.record) return
    setTeVerwijderen({ soort: bewerking.soort, id: bewerking.record.id })
    setBewerking(null)
  }

  function bevestigVerwijderen() {
    if (!teVerwijderen) return
    const target = teVerwijderen
    setTeVerwijderen(null)
    start(async () => {
      try {
        await verwijderRegistratie(target.soort, target.id)
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

        <KindKiezer />

        <section aria-labelledby="geschiedenis-tellerfilters" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">

            <span className="text-xs tabular-nums text-muted-foreground">
              {zichtbareGeschiedenisTellers.length}/{MAX_TELLERS}
            </span>
          </div>
          <ToggleGroup
            multiple
            value={zichtbareGeschiedenisTellers}
            onValueChange={wijzigTellers}
            variant="outline"
            size="sm"
            spacing={1}
            className="flex w-full flex-wrap gap-1"
            aria-label="Tellers voor geschiedenis selecteren"
          >
            {geschiedenisTellers.map((id) => {
              const meta = tellerMeta[id]
              const Icon = meta.icon
              return (
                <ToggleGroupItem key={id} value={id} aria-label={meta.label}>
                  <Icon data-icon="inline-start" aria-hidden />
                  {meta.label}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            Kies maximaal {MAX_TELLERS} tellers voor de kaarten hieronder.
          </p>
        </section>

        {samenvattingen && samenvattingen.length === 0 ? (
          <LegeStatus
            icon={Calendar}
            titel="Nog geen registraties"
            beschrijving="Voeg registraties toe in het tabblad 'Vandaag'."
          />
        ) : samenvattingen ? (
          <div className={bezig ? "flex flex-col gap-2 opacity-60" : "flex flex-col gap-2"}>
            {samenvattingen.map((s) => (
              <DagSamenvattingKaart
                key={s.datum}
                dag={s}
                zichtbareTellers={zichtbareTellers}
              />
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
      {/* Kindkiezer (alleen bij meerdere kinderen), boven de datumnavigatie */}
      <KindKiezer />

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
            {items.map((item) => (
              <TijdlijnItem
                key={`${item.soort}-${item.id}`}
                item={item}
                onBewerk={() => bewerk(item)}
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
        onVerwijder={verwijderVanuitFormulier}
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
