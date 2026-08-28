import Image from "next/image"
import { soortMeta } from "@/lib/soorten"
import { formatTijd, formatDatumLang } from "@/lib/datum"
import { samenvatting, opmerking } from "@/components/tijdlijn-item"
import type { TijdlijnItem as Item } from "@/lib/types"

// Vaste breedte zodat de gerenderde afbeelding altijd hetzelfde formaat
// heeft, ongeacht het scherm waarop de gebruiker 'm exporteert.
export const DEELBARE_KAART_BREEDTE = 360

// Let op: deze kleuren zijn bewust als LETTERLIJKE hex-waarden opgenomen,
// in plaats van de gebruikelijke Tailwind-thema-klassen (`bg-card`,
// `text-muted-foreground`, etc.). Die thema-klassen verwijzen naar
// CSS-variabelen op `:root` (zie globals.css). html-to-image legt deze kaart
// vast via een tijdelijke SVG (<foreignObject>), en daarbinnen wijst `:root`
// naar de <svg>-tag zelf, niet naar de echte pagina — waardoor `var(...)`
// niet oplost en tekst als een vage, lichte kleur wordt weergegeven. Door
// hier vaste hex-waarden te gebruiken (gelijk aan de kleuren uit
// globals.css) omzeilen we dat probleem volledig, ongeacht welk
// rendering-mechanisme wordt gebruikt om de kaart als afbeelding vast te
// leggen.
const KLEUR = {
  kaartRand: "#e7e7df",
  kaartAchtergrond: "#ffffff",
  tekst: "#1f2937",
  tekstGedempt: "#6b7280",
  tekstGedemptZacht: "rgba(107, 114, 128, 0.8)",
}

// Letterlijke iconkleuren per soort, los van `soortMeta.kleur`. De meeste
// waarden daar (bijv. "text-sky-600 bg-sky-500/10") komen uit Tailwinds
// eigen kleurenpalet en worden tijdens het compileren al naar een vaste
// waarde omgezet, dus die renderen prima in de SVG-omweg van html-to-image.
// "vitamine" is de uitzondering: die gebruikt "text-primary bg-primary/10",
// en `--primary` is (net als `--card-foreground` hierboven) een eigen
// `:root`-variabele — dus zonder deze letterlijke tabel zou een gedeelde
// vitamine-kaart weer hetzelfde uitgewassen probleem krijgen.
const ICOON_KLEUR: Record<Item["soort"], { tekst: string; achtergrond: string }> = {
  voeding: { tekst: "#0284c7", achtergrond: "rgba(14, 165, 233, 0.1)" },
  luier: { tekst: "#d97706", achtergrond: "rgba(245, 158, 11, 0.1)" },
  temperatuur: { tekst: "#e11d48", achtergrond: "rgba(244, 63, 94, 0.1)" },
  boertje: { tekst: "#0d9488", achtergrond: "rgba(20, 184, 166, 0.1)" },
  vitamine: { tekst: "#6b8e23", achtergrond: "rgba(107, 142, 35, 0.1)" },
  medicatie: { tekst: "#4f46e5", achtergrond: "rgba(99, 102, 241, 0.1)" },
  groei: { tekst: "#059669", achtergrond: "rgba(16, 185, 129, 0.1)" },
  slapen: { tekst: "#7c3aed", achtergrond: "rgba(139, 92, 246, 0.1)" },
  huilen: { tekst: "#ea580c", achtergrond: "rgba(249, 115, 22, 0.1)" },
  kolven: { tekst: "#0891b2", achtergrond: "rgba(6, 182, 212, 0.1)" },
}

export function DeelbareKaart({ item }: { item: Item }) {
  const meta = soortMeta[item.soort]
  const Icon = meta.icon
  const iconKleur = ICOON_KLEUR[item.soort]
  const notitie = opmerking(item)
  const datum = item.datumTijd.slice(0, 10)

  return (
    <div
      style={{
        width: DEELBARE_KAART_BREEDTE,
        borderRadius: 28,
        border: `1px solid ${KLEUR.kaartRand}`,
        backgroundColor: KLEUR.kaartAchtergrond,
        color: KLEUR.tekst,
      }}
      className="p-5"
    >
      <div className="flex items-start gap-3.5">
        <span
          className="flex size-11 flex-none items-center justify-center rounded-full"
          style={{ color: iconKleur.tekst, backgroundColor: iconKleur.achtergrond }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg font-semibold tabular-nums"
              style={{ color: KLEUR.tekst }}
            >
              {formatTijd(item.datumTijd)}
            </span>
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: KLEUR.tekstGedempt }}
            >
              {meta.label}
            </span>
          </div>
          <div className="mt-1 text-sm" style={{ color: KLEUR.tekstGedempt }}>
            {samenvatting(item)}
          </div>
          {notitie && (
            <div
              className="mt-1.5 whitespace-pre-line text-sm italic leading-relaxed"
              style={{ color: KLEUR.tekstGedemptZacht }}
            >
              {notitie}
            </div>
          )}
        </div>
      </div>

      <div
        className="mt-4 flex items-center justify-between pt-3"
        style={{ borderTop: `1px solid ${KLEUR.kaartRand}` }}
      >
        <span className="flex size-5 items-center justify-center overflow-hidden rounded-md">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={20}
            height={20}
            className="size-5 object-cover"
          />
        </span>
        <span className="text-xs" style={{ color: KLEUR.tekstGedempt }}>
          {formatDatumLang(datum)}
        </span>
      </div>
    </div>
  )
}

