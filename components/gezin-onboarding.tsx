"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KindFormulier } from "@/components/kind-formulier"
import { maakGezinAan } from "@/app/actions/gezinnen"
import { voegKindToe } from "@/app/actions/kinderen"

export function GezinOnboarding() {
  const router = useRouter()
  const [naam, setNaam] = useState("")

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Bijna klaar</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Koppel je Billenboek aan een gezin</h1>
        <p className="text-muted-foreground">Vul je gezinsnaam en de gegevens van je kind in. Met één druk op de knop wordt alles opgeslagen.</p>
      </header>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>1. Maak je gezin aan</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Gezinsnaam
              <Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijvoorbeeld: Familie De Vries" required minLength={2} />
            </label>
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
                if (naam.trim().length < 2) return { ok: false, fout: "Vul eerst een gezinsnaam in." }

                const gezin = await maakGezinAan(naam)
                if (!gezin.ok) return gezin

                const kind = await voegKindToe(invoer)
                if (!kind.ok) return kind

                router.replace("/")
                router.refresh()
                return { ok: true }
              }}
              onKlaar={() => undefined}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
