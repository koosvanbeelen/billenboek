"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { KeuzeGroep } from "@/components/keuze-groep"
import { kindSchema, LEEG_KIND, type KindInvoer } from "@/lib/kinderen"
import type { Uitkomst } from "@/lib/account-validatie"

type Fouten = Partial<Record<keyof KindInvoer, string>>

type Props = {
  beginwaarden?: KindInvoer
  opslaanLabel: string
  onOpslaan: (invoer: KindInvoer) => Promise<Uitkomst>
  // Wordt na een geslaagde opslag aangeroepen.
  onKlaar: () => void
}

// Eén formulier voor "kind toevoegen" (onboarding en instellingen) en "kind bewerken".
// Alleen de naam is verplicht; geboortedatum, geslacht en geboortegewicht zijn optioneel.
export function KindFormulier({ beginwaarden = LEEG_KIND, opslaanLabel, onOpslaan, onKlaar }: Props) {
  const [invoer, setInvoer] = useState<KindInvoer>(beginwaarden)
  const [fouten, setFouten] = useState<Fouten>({})
  const [algemeneFout, setAlgemeneFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  function zet<K extends keyof KindInvoer>(sleutel: K, waarde: KindInvoer[K]) {
    setInvoer((huidig) => ({ ...huidig, [sleutel]: waarde }))
    setFouten((huidig) => ({ ...huidig, [sleutel]: undefined }))
  }

  async function verstuur(event: React.FormEvent) {
    event.preventDefault()
    setAlgemeneFout(null)

    const resultaat = kindSchema.safeParse(invoer)
    if (!resultaat.success) {
      const nieuw: Fouten = {}
      for (const issue of resultaat.error.issues) {
        const veld = issue.path[0] as keyof KindInvoer
        if (!nieuw[veld]) nieuw[veld] = issue.message
      }
      setFouten(nieuw)
      return
    }

    setBezig(true)
    try {
      const uitkomst = await onOpslaan(resultaat.data)
      if (uitkomst.ok) onKlaar()
      else setAlgemeneFout(uitkomst.fout)
    } catch {
      setAlgemeneFout("Er ging iets mis. Controleer je verbinding en probeer het opnieuw.")
    } finally {
      setBezig(false)
    }
  }

  const vandaag = new Date().toLocaleDateString("sv-SE") // yyyy-MM-dd in lokale tijd

  return (
    <form onSubmit={verstuur} className="flex flex-col gap-5" noValidate>
      <Field>
        <FieldLabel htmlFor="kind-naam">Naam</FieldLabel>
        <Input
          id="kind-naam"
          value={invoer.naam}
          onChange={(e) => zet("naam", e.target.value)}
          placeholder="Naam van je kind"
          maxLength={40}
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(fouten.naam)}
          className="h-12 text-base"
        />
        {fouten.naam && <FieldError>{fouten.naam}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="kind-geboortedatum">Geboortedatum (optioneel)</FieldLabel>
        <Input
          id="kind-geboortedatum"
          type="date"
          value={invoer.geboortedatum}
          max={vandaag}
          onChange={(e) => zet("geboortedatum", e.target.value)}
          aria-invalid={Boolean(fouten.geboortedatum)}
          className="h-12 text-base"
        />
        {fouten.geboortedatum && <FieldError>{fouten.geboortedatum}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>Geslacht (optioneel)</FieldLabel>
        <KeuzeGroep
          waarde={invoer.geslacht}
          opties={[
            { waarde: "", label: "Niet invullen" },
            { waarde: "jongen", label: "Jongen" },
            { waarde: "meisje", label: "Meisje" },
            { waarde: "anders", label: "Anders" },
          ]}
          onChange={(waarde) => zet("geslacht", waarde)}
        />
        {fouten.geslacht && <FieldError>{fouten.geslacht}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="kind-gewicht">Geboortegewicht in gram (optioneel)</FieldLabel>
        <Input
          id="kind-gewicht"
          inputMode="numeric"
          pattern="[0-9]*"
          value={invoer.geboortegewichtGram}
          onChange={(e) => zet("geboortegewichtGram", e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Bijvoorbeeld 3450"
          aria-invalid={Boolean(fouten.geboortegewichtGram)}
          className="h-12 text-base"
        />
        {fouten.geboortegewichtGram ? (
          <FieldError>{fouten.geboortegewichtGram}</FieldError>
        ) : (
          <FieldDescription>Hele grammen, zonder punt of komma.</FieldDescription>
        )}
      </Field>

      {algemeneFout && (
        <p role="alert" className="text-sm text-destructive">
          {algemeneFout}
        </p>
      )}

      <Button type="submit" size="lg" disabled={bezig} className="h-12 w-full text-base">
        {bezig ? "Bezig..." : opslaanLabel}
      </Button>
    </form>
  )
}
