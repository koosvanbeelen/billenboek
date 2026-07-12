"use client"

import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VoedingFormulier } from "@/components/formulieren/voeding-formulier"
import { LuierFormulier } from "@/components/formulieren/luier-formulier"
import { TemperatuurFormulier } from "@/components/formulieren/temperatuur-formulier"
import { BoertjeFormulier } from "@/components/formulieren/boertje-formulier"
import { VitamineFormulier } from "@/components/formulieren/vitamine-formulier"
import { MedicatieFormulier } from "@/components/formulieren/medicatie-formulier"
import type {
  BoertjeItem,
  LuierItem,
  MedicatieItem,
  Soort,
  TemperatuurItem,
  VitamineItem,
  VoedingItem,
} from "@/lib/types"

const titels: Record<Soort, string> = {
  voeding: "Voeding",
  luier: "Luier",
  temperatuur: "Temperatuur",
  boertje: "Boertje / spugen",
  vitamine: "Vitamine",
  medicatie: "Medicatie",
}

export type Bewerking =
  | { soort: "voeding"; record?: VoedingItem }
  | { soort: "luier"; record?: LuierItem }
  | { soort: "temperatuur"; record?: TemperatuurItem }
  | { soort: "boertje"; record?: BoertjeItem }
  | { soort: "vitamine"; record?: VitamineItem }
  | { soort: "medicatie"; record?: MedicatieItem }

export function RegistratieDialog({
  bewerking,
  onClose,
  onVerwijder,
}: {
  bewerking: Bewerking | null
  onClose: () => void
  onVerwijder: () => void
}) {
  const open = bewerking !== null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {bewerking && (
        <DialogContent className="top-auto bottom-0 left-1/2 max-h-[90dvh] w-full max-w-md translate-y-0 overflow-y-auto rounded-b-none rounded-t-3xl pb-safe sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-3xl data-open:sm:zoom-in-95">
          <DialogHeader className="flex-row items-start justify-between gap-2 text-left">
            <div className="min-w-0">
              <DialogTitle className="text-lg">
                {bewerking.record ? "Bewerk " : "Nieuwe "}
                {titels[bewerking.soort].toLowerCase()}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulier om een {titels[bewerking.soort].toLowerCase()} registratie op te slaan
              </DialogDescription>
            </div>
            {bewerking.record && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onVerwijder}
                aria-label="Verwijderen"
                className="flex-none text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </DialogHeader>

          {bewerking.soort === "voeding" && (
            <VoedingFormulier bestaand={bewerking.record} onKlaar={onClose} />
          )}
          {bewerking.soort === "luier" && (
            <LuierFormulier bestaand={bewerking.record} onKlaar={onClose} />
          )}
          {bewerking.soort === "temperatuur" && (
            <TemperatuurFormulier bestaand={bewerking.record} onKlaar={onClose} />
          )}
          {bewerking.soort === "boertje" && (
            <BoertjeFormulier bestaand={bewerking.record} onKlaar={onClose} />
          )}
          {bewerking.soort === "vitamine" && (
            <VitamineFormulier bestaand={bewerking.record} onKlaar={onClose} />
          )}
          {bewerking.soort === "medicatie" && (
            <MedicatieFormulier bestaand={bewerking.record} onKlaar={onClose} />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
