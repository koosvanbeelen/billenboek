"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { zetActiefKind } from "@/app/actions/kinderen"
import { KIND_COOKIE, type Kind } from "@/lib/kinderen"

type KindContext = {
  kinderen: Kind[]
  actiefKind: Kind
  kiesKind: (id: number) => Promise<void>
}

const Context = createContext<KindContext | null>(null)

function leesKindCookie(): number | null {
  if (typeof document === "undefined") return null
  const treffer = document.cookie.split("; ").find((c) => c.startsWith(`${KIND_COOKIE}=`))
  if (!treffer) return null
  const waarde = Number(treffer.split("=")[1])
  return Number.isInteger(waarde) ? waarde : null
}

// Brengt de kinderen van het gezin en het gekozen kind (beide komen uit de server-layout) bij
// alle schermen. Het gekozen kind staat in een cookie, zodat de server-acties het ook kennen.
export function KindProvider({
  kinderen,
  actiefKindId,
  children,
}: {
  kinderen: Kind[]
  actiefKindId: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const [actiefId, setActiefId] = useState(actiefKindId)
  const actiefRef = useRef(actiefId)
  actiefRef.current = actiefId

  // Na een router.refresh() komt de waarde van de server leidend terug.
  useEffect(() => setActiefId(actiefKindId), [actiefKindId])

  const actiefKind = kinderen.find((k) => k.id === actiefId) ?? kinderen[0]

  const kiesKind = useCallback(
    async (id: number) => {
      if (id === actiefRef.current) return
      try {
        const uitkomst = await zetActiefKind(id)
        if (!uitkomst.ok) {
          toast.error(uitkomst.fout)
          return
        }
        setActiefId(id)
        router.refresh()
      } catch {
        toast.error("Wisselen lukt niet. Controleer je verbinding en probeer het opnieuw.")
      }
    },
    [router],
  )

  // Is er in een ander tabblad (of venster van de app) van kind gewisseld? De cookie is gedeeld,
  // dus nieuwe registraties zouden bij dat andere kind terechtkomen. Bij terugkeer naar dit
  // tabblad lopen we daarom gelijk met de cookie.
  useEffect(() => {
    function synchroniseer() {
      if (document.visibilityState === "hidden") return
      const cookieId = leesKindCookie()
      if (cookieId !== null && cookieId !== actiefRef.current && kinderen.some((k) => k.id === cookieId)) {
        setActiefId(cookieId)
        router.refresh()
      }
    }
    window.addEventListener("focus", synchroniseer)
    document.addEventListener("visibilitychange", synchroniseer)
    return () => {
      window.removeEventListener("focus", synchroniseer)
      document.removeEventListener("visibilitychange", synchroniseer)
    }
  }, [kinderen, router])

  const waarde = useMemo(() => ({ kinderen, actiefKind, kiesKind }), [kinderen, actiefKind, kiesKind])
  return <Context.Provider value={waarde}>{children}</Context.Provider>
}

export function useKinderen(): KindContext {
  const waarde = useContext(Context)
  if (!waarde) throw new Error("useKinderen moet binnen een KindProvider worden gebruikt.")
  return waarde
}
