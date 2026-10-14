"use client"

import { useState } from "react"
import { createRoot } from "react-dom/client"
import { toast } from "sonner"
import { DeelbareKaart, DEELBARE_KAART_BREEDTE } from "@/components/deelbare-kaart"
import { soortMeta } from "@/lib/soorten"
import type { TijdlijnItem as Item } from "@/lib/types"

// Rendert de DeelbareKaart in een onzichtbaar, niet-interactief element
// buiten beeld, zodat html-to-image 'm kan vastleggen zonder dat de
// gebruiker iets ziet flitsen.
function renderOffscreen(item: Item): { el: HTMLDivElement; ruim: () => void } {
  const el = document.createElement("div")
  el.style.position = "fixed"
  el.style.top = "0"
  el.style.left = "-9999px"
  el.style.pointerEvents = "none"
  document.body.appendChild(el)

  const root = createRoot(el)
  root.render(<DeelbareKaart item={item} />)

  return {
    el,
    ruim: () => {
      root.unmount()
      el.remove()
    },
  }
}

// html-to-image wordt dynamisch geladen: alleen wanneer iemand daadwerkelijk
// op de deelknop drukt, niet als onderdeel van de hoofdbundel.
async function kaartNaarPng(item: Item): Promise<Blob> {
  const { toBlob } = await import("html-to-image")
  const { el, ruim } = renderOffscreen(item)

  // Eén tick wachten zodat React de kaart daadwerkelijk in de DOM heeft
  // gezet (en het lettertype/icoon geladen is) voordat we 'm vastleggen.
  await new Promise((r) => setTimeout(r, 50))

  try {
    const blob = await toBlob(el.firstElementChild as HTMLElement, {
      pixelRatio: 2,
      width: DEELBARE_KAART_BREEDTE,
      backgroundColor: "#FFFFFF",
    })
    if (!blob) throw new Error("Afbeelding kon niet worden gemaakt")
    return blob
  } finally {
    ruim()
  }
}

export function useDeelKaart() {
  const [bezig, setBezig] = useState(false)

  async function deel(item: Item) {
    setBezig(true)
    try {
      const blob = await kaartNaarPng(item)
      const bestandsnaam = `billenboek-${soortMeta[item.soort].label.toLowerCase()}.png`
      const bestand = new File([blob], bestandsnaam, { type: "image/png" })

      if (navigator.share && navigator.canShare?.({ files: [bestand] })) {
        await navigator.share({ files: [bestand] })
        return
      }

      // Fallback (bijv. desktop zonder Web Share API): download de kaart.
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = bestandsnaam
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Kaart gedownload")
    } catch (err) {
      // Gebruiker die het deelvenster annuleert gooit ook een AbortError;
      // dat is geen fout om te melden.
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error(err)
      toast.error("Delen is niet gelukt")
    } finally {
      setBezig(false)
    }
  }

  return { deel, bezig }
}
