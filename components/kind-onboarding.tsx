"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KindFormulier } from "@/components/kind-formulier"
import { voegKindToe } from "@/app/actions/kinderen"

// Laatste stap van het aanmelden: zonder minimaal één kind kun je de app niet gebruiken
// (de layout stuurt iedereen zonder kind hiernaartoe).
export function KindOnboarding() {
  const router = useRouter()

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Laatste stap</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Voor wie houd je het Billenboek bij?</h1>
        <p className="text-muted-foreground">
          Voeg minimaal één kind toe. Meer kinderen toevoegen kan later bij Instellingen &gt; Gezin.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Je kind</CardTitle>
          <CardDescription>Alleen de naam is verplicht.</CardDescription>
        </CardHeader>
        <CardContent>
          <KindFormulier
            opslaanLabel="Verder naar Vandaag"
            onOpslaan={voegKindToe}
            onKlaar={() => {
              router.replace("/")
              router.refresh()
            }}
          />
        </CardContent>
      </Card>
    </main>
  )
}
