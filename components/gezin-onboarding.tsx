"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KindFormulier } from "@/components/kind-formulier"
import { GezinUitnodiging } from "@/components/gezin-uitnodiging"
import { maakGezinAan } from "@/app/actions/gezinnen"
import { voegKindToe } from "@/app/actions/kinderen"

type Stap = "onboarding" | "uitnodiging"

export function GezinOnboarding({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter()
  const [stap, setStap] = useState<Stap>("onboarding")
  const [naam, setNaam] = useState("")
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
        setStap("onboarding")
      } else setFout(r.fout)
    } catch {
      setFout("Er ging iets mis. Controleer je verbinding en probeer het opnieuw.")
    } finally {
      setBezig(false)
    }
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
          <CardHeader>
            <CardTitle>1. Maak je gezin aan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitCreate} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Gezinsnaam
                <Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld: Familie De Vries" required minLength={2} />
              </label>
              <Button type="submit" disabled={bezig}>{bezig ? "Bezig..." : "Gezin aanmaken"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Voeg een kind toe</CardTitle>
          </CardHeader>
          <CardContent>
            <KindFormulier
              opslaanLabel="Verder"
              onOpslaan={async (invoer) => {
                if (!uitnodigingsCode) return { ok: false, fout: "Maak eerst je gezin aan." }
                return voegKindToe(invoer)
              }}
              onKlaar={() => setStap("uitnodiging")}
            />
          </CardContent>
        </Card>
      </div>
      {fout && <p role="alert" className="text-sm text-destructive">{fout}</p>}
    </main>
  )
}
