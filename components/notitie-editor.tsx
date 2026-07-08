"use client"

import { useRef } from "react"
import { Bold, Italic, List, ListOrdered, ListTodo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  waarde: string
  onWaardeChange: (waarde: string) => void
  disabled?: boolean
  autoFocus?: boolean
  rows?: number
  placeholder?: string
}

const CHECKBOX_PATROON = /^-\s\[[ xX]\]\s?/
const BULLET_PATROON = /^-\s(?!\[)/
const GENUMMERD_PATROON = /^\d+\.\s/

// Zelfde uitstraling als het gedeelde Textarea-component, maar met een eigen
// ref zodat de opmaakknoppen de tekstselectie kunnen lezen en aanpassen.
const TEXTAREA_CLASSNAME =
  "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"

export function NotitieEditor({
  waarde,
  onWaardeChange,
  disabled,
  autoFocus,
  rows = 3,
  placeholder = "Schrijf een losse gedachte of aantekening...",
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function stelSelectieIn(start: number, eind: number) {
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(start, eind)
    })
  }

  // Zet opmaaktekens rond de selectie, of haalt ze weg als de selectie er al mee omringd is.
  function omringSelectie(marker: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const eind = el.selectionEnd
    const geselecteerd = waarde.slice(start, eind)
    const voor = waarde.slice(Math.max(0, start - marker.length), start)
    const na = waarde.slice(eind, eind + marker.length)

    if (voor === marker && na === marker) {
      const nieuw = waarde.slice(0, start - marker.length) + geselecteerd + waarde.slice(eind + marker.length)
      onWaardeChange(nieuw)
      stelSelectieIn(start - marker.length, eind - marker.length)
      return
    }

    const nieuw = waarde.slice(0, start) + marker + geselecteerd + marker + waarde.slice(eind)
    onWaardeChange(nieuw)
    stelSelectieIn(start + marker.length, eind + marker.length)
  }

  /** Zet of verwijdert een regelprefix (bullet/genummerd/checklist) op alle geselecteerde regels. */
  function wisselRegelPrefix(maakPrefix: (volgnummer: number) => string, herkenPatroon: RegExp) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const eind = el.selectionEnd

    const blokStart = waarde.lastIndexOf("\n", start - 1) + 1
    let blokEind = waarde.indexOf("\n", eind)
    if (blokEind === -1) blokEind = waarde.length

    const blokRegels = waarde.slice(blokStart, blokEind).split("\n")
    const alHeleBlokPrefix = blokRegels.every(
      (regel) => herkenPatroon.test(regel) || regel.trim() === ""
    )

    let volgnummer = 1
    const nieuweRegels = blokRegels.map((regel) => {
      const kaleTekst = regel
        .replace(CHECKBOX_PATROON, "")
        .replace(BULLET_PATROON, "")
        .replace(GENUMMERD_PATROON, "")

      if (alHeleBlokPrefix || regel.trim() === "") {
        return kaleTekst
      }
      const prefix = maakPrefix(volgnummer)
      volgnummer += 1
      return prefix + kaleTekst
    })

    const nieuwBlok = nieuweRegels.join("\n")
    const nieuweWaarde = waarde.slice(0, blokStart) + nieuwBlok + waarde.slice(blokEind)
    onWaardeChange(nieuweWaarde)
    stelSelectieIn(blokStart, blokStart + nieuwBlok.length)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1" role="toolbar" aria-label="Tekstopmaak">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => omringSelectie("**")}
          disabled={disabled}
          aria-label="Vet"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => omringSelectie("*")}
          disabled={disabled}
          aria-label="Cursief"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => wisselRegelPrefix(() => "- ", BULLET_PATROON)}
          disabled={disabled}
          aria-label="Opsomming"
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => wisselRegelPrefix((n) => `${n}. `, GENUMMERD_PATROON)}
          disabled={disabled}
          aria-label="Genummerde lijst"
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => wisselRegelPrefix(() => "- [ ] ", CHECKBOX_PATROON)}
          disabled={disabled}
          aria-label="Checklist"
        >
          <ListTodo className="size-4" />
        </Button>
      </div>
      <textarea
        ref={textareaRef}
        value={waarde}
        onChange={(e) => onWaardeChange(e.target.value)}
        rows={rows}
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(TEXTAREA_CLASSNAME)}
      />
    </div>
  )
}
