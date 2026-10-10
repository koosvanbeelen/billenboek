"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, Check, Copy, Link2, MessageCircle, Share2, UserMinus, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { maakNieuweUitnodiging, trekUitnodigingIn, verwijderGezinslid, type Gezinsgegevens, type GezinsLid } from "@/app/actions/gezinnen"

const ROL_LABEL: Record<string, string> = { eigenaar: "Eigenaar", lid: "Lid" }

function datumKort(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })
}

export function GezinKaart({ gezinsgegevens }: { gezinsgegevens: Gezinsgegevens }) {
  const router = useRouter()
  const [uitnodiging, setUitnodiging] = useState<{ code: string; vervaltOp: string } | null>(
    gezinsgegevens.actieveCode ? { code: gezinsgegevens.actieveCode.code, vervaltOp: gezinsgegevens.actieveCode.vervalt_op } : null,
  )
  const [lidVerwijderen, setLidVerwijderen] = useState<GezinsLid | null>(null)
  const [intrekOpen, setIntrekOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [origin, setOrigin] = useState("")
  const [kanDelen, setKanDelen] = useState(false)

  // window bestaat pas na mount; zo blijft de server-render identiek aan de eerste client-render.
  useEffect(() => {
    setOrigin(window.location.origin)
    setKanDelen(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  const gezinNaam = gezinsgegevens.gezin?.naam ?? "ons gezin"
  const link = uitnodiging && origin ? `${origin}/gezin/deelnemen?code=${encodeURIComponent(uitnodiging.code)}` : ""
  const bericht = `Doe mee met ons Billenboek (${gezinNaam}). Open deze link en maak een account: ${link}`

  async function nieuweCode() {
    setBezig(true)
    try {
      const r = await maakNieuweUitnodiging()
      if (!r.ok) return toast.error(r.fout)
      setUitnodiging({ code: r.code, vervaltOp: r.vervaltOp })
      setGekopieerd(false)
      toast.success("Nieuwe code gemaakt. De vorige code werkt niet meer.")
    } catch {
      toast.error("Nieuwe code aanmaken lukt niet. Probeer het opnieuw.")
    } finally {
      setBezig(false)
    }
  }

  async function intrekken() {
    setIntrekOpen(false)
    setBezig(true)
    try {
      const r = await trekUitnodigingIn()
      if (!r.ok) return toast.error(r.fout)
      setUitnodiging(null)
      toast.success("Code ingetrokken")
    } catch {
      toast.error("Intrekken lukt niet. Probeer het opnieuw.")
    } finally {
      setBezig(false)
    }
  }

  async function lidVerwijderBevestigd() {
    const lid = lidVerwijderen
    setLidVerwijderen(null)
    if (!lid) return
    try {
      const r = await verwijderGezinslid(lid.user_id)
      if (!r.ok) return toast.error(r.fout)
      toast.success(`${lid.naam ?? "Gezinslid"} is uit het gezin verwijderd`)
      router.refresh()
    } catch {
      toast.error("Verwijderen lukt niet. Probeer het opnieuw.")
    }
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(link)
      setGekopieerd(true)
      toast.success("Link gekopieerd")
      setTimeout(() => setGekopieerd(false), 3000)
    } catch {
      toast.error("Kopiëren lukt niet. Selecteer de code en kopieer die zelf.")
    }
  }

  async function deel() {
    try {
      await navigator.share({ title: "Billenboek", text: bericht })
    } catch {
      // Geannuleerd door de gebruiker: geen foutmelding nodig.
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="text-sm text-muted-foreground">Gezin</p>
        <h2 className="text-lg font-semibold text-card-foreground">{gezinsgegevens.gezin?.naam}</h2>
      </div>

      <ul className="flex flex-col gap-3" aria-label="Gezinsleden">
        {gezinsgegevens.leden.map((lid) => {
          const naam = lid.naam ?? "Gezinslid"
          return (
            <li key={lid.user_id} className="flex items-center gap-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary" aria-hidden>
                {naam.charAt(0).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-medium text-card-foreground">
                  {naam}{lid.ben_ik ? " (jij)" : ""}
                </span>
                <span className="text-sm text-muted-foreground">{ROL_LABEL[lid.rol] ?? lid.rol}</span>
              </div>
              {gezinsgegevens.ikBenEigenaar && !lid.ben_ik ? (
                <Button variant="ghost" size="icon-lg" className="size-12 flex-none text-muted-foreground" onClick={() => setLidVerwijderen(lid)} aria-label={`${naam} uit het gezin verwijderen`}>
                  <UserMinus className="size-5" aria-hidden />
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <UserPlus className="size-4 text-primary" aria-hidden />
          Iemand uitnodigen
        </div>

        {uitnodiging ? (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2">
              <span className="font-mono text-lg tracking-widest text-foreground" aria-label="Uitnodigingscode">{uitnodiging.code}</span>
              <span className="text-xs text-muted-foreground">geldig t/m {datumKort(uitnodiging.vervaltOp)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {kanDelen ? (
                <Button className="col-span-2 h-12 text-base" onClick={deel} disabled={!link}>
                  <Share2 data-icon="inline-start" aria-hidden />Deel uitnodiging
                </Button>
              ) : null}
              <Button
                variant={kanDelen ? "outline" : "default"}
                className="h-12 text-base"
                render={<a href={link ? `https://wa.me/?text=${encodeURIComponent(bericht)}` : undefined} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                disabled={!link}
              >
                <MessageCircle data-icon="inline-start" aria-hidden />WhatsApp
              </Button>
              <Button variant="outline" className="h-12 text-base" onClick={kopieer} disabled={!link}>
                {gekopieerd ? <Check data-icon="inline-start" aria-hidden /> : <Copy data-icon="inline-start" aria-hidden />}
                {gekopieerd ? "Gekopieerd" : "Kopieer link"}
              </Button>
            </div>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Link2 className="mt-0.5 size-3.5 flex-none" aria-hidden />
              Iedereen met deze link of code kan 7 dagen lang aansluiten bij {gezinNaam}, ook meerdere mensen. Deel hem dus alleen met mensen die je vertrouwt.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" className="h-12" onClick={nieuweCode} disabled={bezig}>
                {bezig ? "Bezig..." : "Nieuwe code"}
              </Button>
              {gezinsgegevens.ikBenEigenaar ? (
                <Button variant="ghost" className="h-12 text-destructive" onClick={() => setIntrekOpen(true)} disabled={bezig}>
                  <Ban data-icon="inline-start" aria-hidden />Intrekken
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Er is nog geen geldige uitnodigingscode. Maak er een om iemand te laten aansluiten.</p>
            <Button className="h-12 text-base" onClick={nieuweCode} disabled={bezig}>
              {bezig ? "Bezig..." : "Uitnodiging maken"}
            </Button>
          </>
        )}
      </div>
      <BevestigDialog
        open={intrekOpen}
        onOpenChange={setIntrekOpen}
        titel="Code intrekken?"
        beschrijving="De huidige code en link werken daarna niet meer. Wie al lid is, blijft lid."
        bevestigLabel="Intrekken"
        onBevestig={intrekken}
      />
      <BevestigDialog
        open={lidVerwijderen !== null}
        onOpenChange={(open) => { if (!open) setLidVerwijderen(null) }}
        titel={`${lidVerwijderen?.naam ?? "Dit gezinslid"} verwijderen?`}
        beschrijving="Deze persoon heeft daarna geen toegang meer tot jullie gegevens. De registraties blijven bij het gezin bewaard."
        onBevestig={lidVerwijderBevestigd}
      />
    </section>
  )
}
