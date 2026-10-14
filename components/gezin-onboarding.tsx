"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KindFormulier } from "@/components/kind-formulier"
import { GezinUitnodiging } from "@/components/gezin-uitnodiging"
import { maakGezinAan, neemDeelMetCode } from "@/app/actions/gezinnen"
import { voegKindToe } from "@/app/actions/kinderen"

type Stap = "gezin" | "kind" | "uitnodiging"

export function GezinOnboarding({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter()
  const [stap, setStap] = useState<Stap>("gezin")
  const [naam, setNaam] = useState("")
  const [code, setCode] = useState(initialCode)
  const [uitnodigingsCode, setUitnodigingsCode] = useState("")
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault()
    setBezig(true)
    setFout(null)
    try {
      const r = await maakGezinAan(naam)
      if (r.ok) {
        setUitnodigingsCode(r.code)
        setStap("kind")
      } else setFout(r.fout)
    } catch {
      setFout("Er ging iets mis. Controleer je verbinding en probeer het opnieuw.")
    } finally {
      setBezig(false)
    }
  }

  async function submitJoin(event: React.FormEvent) {
    event.preventDefault()
    setBezig(true)
    setFout(null)
    try {
      const r = await neemDeelMetCode(code)
      if (r.ok) router.replace("/")
      else setFout(r.fout)
    } catch {
      setFout("Er ging iets mis. Controleer je verbinding en probeer het opnieuw.")
    } finally {
      setBezig(false)
    }
  }

  if (stap === "kind") {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">Bijna klaar</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Voor wie houd je het Billenboek bij?</h1>
          <p className="text-muted-foreground">Voeg minimaal één kind toe. Meer kinderen toevoegen kan later bij Instellingen &gt; Gezin.</p>
        </header>
        <Card>
          <CardHeader><CardTitle>Je kind</CardTitle></CardHeader>
          <CardContent>
            <KindFormulier
              opslaanLabel="Verder"
              onOpslaan={voegKindToe}
              onKlaar={() => setStap("uitnodiging")}
            />
          </CardContent>
        </Card>
      </main>
    )
  }

  if (stap === "uitnodiging") {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        <GezinUitnodiging code={uitnodigingsCode} gezinNaam={naam.trim()} />
        <Button variant="ghost" onClick={() => { router.replace("/"); router.refresh() }}>Verder</Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Bijna klaar</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Koppel je Billenboek aan een gezin</h1>
        <p className="text-muted-foreground">Werk samen met je partner of andere verzorgers in één gedeelde omgeving.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Start een nieuw gezin</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitCreate} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">Gezinsnaam<Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld: Familie De Vries" required minLength={2} /></label>
              <Button type="submit" disabled={bezig}>{bezig ? "Bezig..." : "Gezin aanmaken"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ik heb een uitnodigingscode</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitJoin} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">Uitnodigingscode<Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="AB12CD34" required minLength={8} maxLength={8} autoCapitalize="characters" autoComplete="off" spellCheck={false} /></label>
              <Button type="submit" variant="outline" disabled={bezig}>{bezig ? "Bezig..." : "Aansluiten"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {fout && <p role="alert" className="text-sm text-destructive">{fout}</p>}
    </main>
  )
}
