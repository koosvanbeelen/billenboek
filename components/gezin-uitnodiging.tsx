"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Link2, MessageCircle, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GezinUitnodiging({ code, gezinNaam }: { code: string; gezinNaam: string }) {
  const [origin, setOrigin] = useState("")
  const [kanDelen, setKanDelen] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    setKanDelen(typeof navigator.share === "function")
  }, [])

  const link = origin ? `${origin}/gezin/deelnemen?code=${encodeURIComponent(code)}` : ""
  const bericht = `Doe mee met ons Billenboek (${gezinNaam}). Open deze link en maak een account: ${link}`

  async function deel() {
    if (!link) return
    try {
      await navigator.share({ title: "Billenboek", text: bericht })
    } catch {
      // De gebruiker kan het deelvenster sluiten zonder actie.
    }
  }

  async function kopieer() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setGekopieerd(true)
      window.setTimeout(() => setGekopieerd(false), 3000)
    } catch {
      // De link blijft ook zichtbaar via WhatsApp en delen.
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Gezin aangemaakt</p>
        <h2 className="text-2xl font-semibold text-card-foreground">Nodig je partner uit</h2>
        <p className="text-muted-foreground">Stuur direct een link zodat je partner aan {gezinNaam} kan deelnemen.</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <span className="font-mono text-lg tracking-widest text-foreground">{code}</span>
        <span className="text-xs text-muted-foreground">7 dagen geldig</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {kanDelen ? (
          <Button className="h-12 text-base sm:col-span-2" onClick={deel} disabled={!link}>
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
        Iedereen met deze link kan zich aansluiten bij {gezinNaam}. Deel hem alleen met iemand die je vertrouwt.
      </p>
    </section>
  )
}
