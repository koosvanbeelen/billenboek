"use client"

import { useCallback, useEffect, useState } from "react"
import { inputNaarDatum, nuInputWaarde } from "@/lib/datum"

const OPSLAG_SLEUTEL = "billenboek:actieve-timers"
const WIJZIG_EVENT = "billenboek:actieve-timers-wijziging"

export type TimerSoort = "slapen" | "huilen"

// Starttijdstippen worden bewaard als dezelfde "yyyy-MM-ddTHH:mm"
// wandkloktijd-string die de rest van de app gebruikt (zie lib/datum.ts),
// zodat ze zonder conversie in de formulieren gebruikt kunnen worden en
// consistent blijven met hoe duur elders berekend wordt.
type TimerState = Record<TimerSoort, string | null>

const STANDAARD: TimerState = { slapen: null, huilen: null }

function isGeldig(waarde: unknown): waarde is TimerState {
  if (typeof waarde !== "object" || waarde === null) return false
  const w = waarde as Record<string, unknown>
  return (
    (w.slapen === null || typeof w.slapen === "string") &&
    (w.huilen === null || typeof w.huilen === "string")
  )
}

function leesOpgeslagenWaarde(): TimerState {
  if (typeof window === "undefined") return STANDAARD
  try {
    const ruw = window.localStorage.getItem(OPSLAG_SLEUTEL)
    if (!ruw) return STANDAARD
    const geparsed = JSON.parse(ruw)
    const aangevuld = { ...STANDAARD, ...geparsed }
    return isGeldig(aangevuld) ? aangevuld : STANDAARD
  } catch {
    return STANDAARD
  }
}

function schrijf(waarde: TimerState) {
  window.localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify(waarde))
  window.dispatchEvent(new CustomEvent(WIJZIG_EVENT, { detail: waarde }))
}

// Verstreken hele seconden sinds een opgeslagen starttijd, met dezelfde
// wandkloktijd-conventie als de rest van de app (zie duurInMinuten).
export function verstrekenSeconden(sinds: string): number {
  const ms =
    inputNaarDatum(nuInputWaarde()).getTime() - inputNaarDatum(sinds).getTime()
  return Math.max(0, Math.floor(ms / 1000))
}

/**
 * Live start/stop-timer voor "Slapen" en "Huilen". Eerste tik op de
 * actieknop start de timer (blijft actief bij herladen/navigeren, via
 * localStorage). Tweede tik bepaalt de eindtijd, stopt de timer, en levert
 * start + einde op zodat het bewerkformulier hiermee voorgevuld kan worden.
 */
export function useActieveTimer(soort: TimerSoort) {
  const [alle, setAlle] = useState<TimerState>(STANDAARD)

  useEffect(() => {
    setAlle(leesOpgeslagenWaarde())
    function opWijziging(event: Event) {
      const detail = (event as CustomEvent<TimerState>).detail
      if (isGeldig(detail)) setAlle(detail)
    }
    window.addEventListener(WIJZIG_EVENT, opWijziging)
    return () => window.removeEventListener(WIJZIG_EVENT, opWijziging)
  }, [])

  const beginTimer = useCallback(() => {
    const nieuw = { ...leesOpgeslagenWaarde(), [soort]: nuInputWaarde() }
    schrijf(nieuw)
    setAlle(nieuw)
  }, [soort])

  const eindigTimer = useCallback((): {
    start: string
    einde: string
  } | null => {
    const huidig = leesOpgeslagenWaarde()
    const startTijd = huidig[soort]
    if (!startTijd) return null
    const nieuw = { ...huidig, [soort]: null }
    schrijf(nieuw)
    setAlle(nieuw)
    return { start: startTijd, einde: nuInputWaarde() }
  }, [soort])

  return { loopt: alle[soort] !== null, startTijd: alle[soort], beginTimer, eindigTimer }
}
