import Image from "next/image"
import { soortMeta } from "@/lib/soorten"
import { formatTijd, formatDatumLang } from "@/lib/datum"
import { samenvatting, opmerking } from "@/components/tijdlijn-item"
import type { TijdlijnItem as Item } from "@/lib/types"

// Vaste breedte zodat de gerenderde afbeelding altijd hetzelfde formaat
// heeft, ongeacht het scherm waarop de gebruiker 'm exporteert.
export const DEELBARE_KAART_BREEDTE = 360

// Losstaande, "schone" weergave van één tijdlijn-item, bedoeld om met
// html-to-image te worden vastgelegd als PNG (bijv. om te delen via
// WhatsApp). Geen hover/active-status of bewerk-interactie, in
// tegenstelling tot de gewone `TijdlijnItem`-kaart in de tijdlijn zelf.
export function DeelbareKaart({ item }: { item: Item }) {
  const meta = soortMeta[item.soort]
  const Icon = meta.icon
  const notitie = opmerking(item)
  const datum = item.datumTijd.slice(0, 10)

  return (
    <div
      style={{ width: DEELBARE_KAART_BREEDTE }}
      className="rounded-3xl border border-border bg-card p-5 text-card-foreground"
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`flex size-11 flex-none items-center justify-center rounded-full ${meta.kleur}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {formatTijd(item.datumTijd)}
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {meta.label}
            </span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {samenvatting(item)}
          </div>
          {notitie && (
            <div className="mt-1.5 whitespace-pre-line text-sm italic leading-relaxed text-muted-foreground/80">
              {notitie}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="flex size-5 items-center justify-center overflow-hidden rounded-md">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={20}
            height={20}
            className="size-5 object-cover"
          />
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDatumLang(datum)}
        </span>
      </div>
    </div>
  )
}
