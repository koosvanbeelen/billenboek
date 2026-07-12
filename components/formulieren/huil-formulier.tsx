"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { DatumTijdKiezer } from "@/components/datum-tijd-kiezer"
import { voegHuilToe, werkHuilBij } from "@/app/actions/registraties"
import { nuInputWaarde, datumNaarInput, duurInMinuten, formatDuur } from "@/lib/datum"
import type { HuilItem } from "@/lib/types"

type Props = { bestaand?: HuilItem; onKlaar: () => void }

export function HuilFormulier({ bestaand, onKlaar }: Props) {
  const [bezig, setBezig] = useState(false)
  const [start, setStart] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.start)) : nuInputWaarde(),
  )
  const [einde, setEinde] = useState(
    bestaand ? datumNaarInput(new Date(bestaand.einde)) : nuInputWaarde(),
  )
  const [oorzaak, setOorzaak] = useState(bestaand?.oorzaak ?? "")
  const [troost, setTroost] = useState(bestaand?.troost ?? "")
  const [fout, setFout] = useState<string | null>(null)

  const duur = useMemo(() => duurInMinuten(start, einde), [start, einde])
  const duurGeldig = new Date(`${einde}:00.000Z`) > new Date(`${start}:00.000Z`)

  async function verstuur() {
    if (!duurGeldig) {
      setFout("Einde moet na start liggen")
      return
    }
    setBezig(true)
    setFout(null)
    try {
      const input = {
        start,
        einde,
        oorzaak: oorzaak.trim() || undefined,
        troost: troost.trim() || undefined,
      }
      if (bestaand) await werkHuilBij(bestaand.id, input)
      else await voegHuilToe(input)
      toast.success(bestaand ? "Bijgewerkt" : "Opgeslagen")
      onKlaar()
    } catch {
      setFout("Er ging iets mis bij het opslaan")
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel>Start</FieldLabel>
        <DatumTijdKiezer waarde={start} onChange={setStart} />
      </Field>

      <Field>
        <FieldLabel>Einde</FieldLabel>
        <DatumTijdKiezer waarde={einde} onChange={setEinde} />
      </Field>

      <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
        Duur:{" "}
        <span className="font-medium text-card-foreground">
          {duurGeldig ? formatDuur(duur) : "—"}
        </span>
      </div>

      <Field>
        <FieldLabel htmlFor="oorzaak">Oorzaak (optioneel)</FieldLabel>
        <Input
          id="oorzaak"
          value={oorzaak}
          onChange={(e) => setOorzaak(e.target.value)}
          placeholder="Bijv. honger, buikpijn, moe"
          className="h-12 text-base"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="troost">Troost (optioneel)</FieldLabel>
        <Input
          id="troost"
          value={troost}
          onChange={(e) => setTroost(e.target.value)}
          placeholder="Bijv. dragen, voeding, knuffel"
          className="h-12 text-base"
        />
      </Field>

      {fout && <FieldError>{fout}</FieldError>}

      <Button onClick={verstuur} disabled={bezig} size="lg" className="h-12 w-full text-base">
        {bezig ? "Bezig..." : bestaand ? "Bijwerken" : "Opslaan"}
      </Button>
    </div>
  )
}
