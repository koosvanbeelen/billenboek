"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Baby, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { KindFormulier } from "@/components/kind-formulier"
import { voegKindToe, verwijderKind, werkKindBij } from "@/app/actions/kinderen"
import { formatDatumLang } from "@/lib/datum"
import {
  formatLeeftijd,
  GESLACHT_LABEL,
  kindNaarInvoer,
  LEEG_KIND,
  type Kind,
} from "@/lib/kinderen"

// Een kind toevoegen of bewerken: "nieuw" = leeg formulier, een Kind = bewerken.
type Bewerking = "nieuw" | Kind | null

function omschrijving(kind: Kind): string {
  const delen: string[] = []
  if (kind.geboortedatum) {
    const leeftijd = formatLeeftijd(kind.geboortedatum)
    delen.push(leeftijd ? `${leeftijd} oud` : formatDatumLang(kind.geboortedatum))
  }
  if (kind.geslacht) delen.push(GESLACHT_LABEL[kind.geslacht])
  if (kind.geboortegewichtGram !== null) delen.push(`${kind.geboortegewichtGram.toLocaleString("nl-NL")} g`)
  return delen.join(" · ") || "Geen extra gegevens"
}

export function KinderenKaart({ kinderen }: { kinderen: Kind[] }) {
  const router = useRouter()
  const [bewerking, setBewerking] = useState<Bewerking>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<Kind | null>(null)

  const bewerkt = bewerking !== null && bewerking !== "nieuw" ? bewerking : null
  const kanVerwijderen = kinderen.length > 1

  async function verwijderBevestigd() {
    const kind = teVerwijderen
    setTeVerwijderen(null)
    if (!kind) return
    try {
      const uitkomst = await verwijderKind(kind.id)
      if (!uitkomst.ok) return toast.error(uitkomst.fout)
      toast.success(`${kind.naam} is verwijderd`)
      router.refresh()
    } catch {
      toast.error("Verwijderen lukt niet. Probeer het opnieuw.")
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Baby className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold text-card-foreground">Kinderen</h2>
      </div>

      <ul className="flex flex-col gap-3" aria-label="Kinderen">
        {kinderen.map((kind) => (
          <li key={kind.id} className="flex items-center gap-3">
            <span
              className="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
              aria-hidden
            >
              {kind.naam.charAt(0).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-base font-medium text-card-foreground">{kind.naam}</span>
              <span className="text-sm text-muted-foreground">{omschrijving(kind)}</span>
            </div>
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-12 flex-none text-muted-foreground"
              onClick={() => setBewerking(kind)}
              aria-label={`${kind.naam} bewerken`}
            >
              <Pencil className="size-5" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>

      <Button variant="outline" size="lg" className="h-12 w-full text-base" onClick={() => setBewerking("nieuw")}>
        <Plus data-icon="inline-start" aria-hidden />
        Kind toevoegen
      </Button>

      <Dialog open={bewerking !== null} onOpenChange={(open) => !open && setBewerking(null)}>
        {bewerking !== null && (
          <DialogContent className="top-auto bottom-0 left-1/2 max-h-[90dvh] w-full max-w-md translate-y-0 overflow-y-auto rounded-b-none rounded-t-3xl pb-safe sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-3xl data-open:sm:zoom-in-95">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg">
                {bewerkt ? `${bewerkt.naam} bewerken` : "Kind toevoegen"}
              </DialogTitle>
              <DialogDescription>
                {bewerkt
                  ? "Pas de gegevens van je kind aan."
                  : "Alleen de naam is verplicht. De rest kun je later aanvullen."}
              </DialogDescription>
            </DialogHeader>

            <KindFormulier
              // Nieuwe sleutel per kind, zodat het formulier met de juiste beginwaarden start.
              key={bewerkt ? bewerkt.id : "nieuw"}
              beginwaarden={bewerkt ? kindNaarInvoer(bewerkt) : LEEG_KIND}
              opslaanLabel={bewerkt ? "Opslaan" : "Toevoegen"}
              onOpslaan={(invoer) => (bewerkt ? werkKindBij(bewerkt.id, invoer) : voegKindToe(invoer))}
              onKlaar={() => {
                toast.success(bewerkt ? "Opgeslagen" : "Kind toegevoegd")
                setBewerking(null)
                router.refresh()
              }}
            />

            {bewerkt &&
              (kanVerwijderen ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 w-full text-base text-destructive hover:text-destructive"
                  onClick={() => {
                    setTeVerwijderen(bewerkt)
                    setBewerking(null)
                  }}
                >
                  <Trash2 data-icon="inline-start" aria-hidden />
                  {bewerkt.naam} verwijderen
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Je kunt het enige kind niet verwijderen: er moet minimaal één kind overblijven.
                </p>
              ))}
          </DialogContent>
        )}
      </Dialog>

      <BevestigDialog
        open={teVerwijderen !== null}
        onOpenChange={(open) => !open && setTeVerwijderen(null)}
        titel={teVerwijderen ? `${teVerwijderen.naam} verwijderen?` : "Kind verwijderen?"}
        beschrijving="Alle registraties van dit kind (voedingen, luiers, temperatuur, groei en meer) worden ook verwijderd. Dit kan niet ongedaan worden gemaakt."
        onBevestig={verwijderBevestigd}
      />
    </section>
  )
}
