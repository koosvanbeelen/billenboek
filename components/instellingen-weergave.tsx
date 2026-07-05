"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  Moon,
  DatabaseZap,
  Info,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { controleerDatabase } from "@/app/actions/systeem"

type DbStatus = { ok: boolean; bericht: string }

export function InstellingenWeergave({ versie }: { versie: string }) {
  // Voorkomt een hydration-mismatch: het thema is pas na mount bekend.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { theme, setTheme } = useTheme()

  const [dbBezig, setDbBezig] = useState(false)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)

  const [resetOpen, setResetOpen] = useState(false)

  async function testVerbinding() {
    setDbBezig(true)
    setDbStatus(null)
    try {
      const resultaat = await controleerDatabase()
      setDbStatus(resultaat)
    } catch {
      setDbStatus({
        ok: false,
        bericht: "Geen verbinding met de database. Probeer het later opnieuw.",
      })
    } finally {
      setDbBezig(false)
    }
  }

  function resetVoorkeuren() {
    setTheme("light")
    setDbStatus(null)
    setResetOpen(false)
    toast.success("Voorkeuren gereset")
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Instellingen
      </h1>

      {/* Weergave */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Moon className="size-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="text-base font-medium text-card-foreground">
                Donkere modus
              </span>
              <span className="text-sm text-muted-foreground">
                Lichte modus is de standaard
              </span>
            </div>
          </div>
          {mounted ? (
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
              aria-label="Donkere modus aan of uit"
            />
          ) : (
            <div className="h-[18.4px] w-[32px]" aria-hidden />
          )}
        </div>
      </section>

      {/* Systeem */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DatabaseZap className="size-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="text-base font-medium text-card-foreground">
                Databaseverbinding
              </span>
              <span className="text-sm text-muted-foreground">
                Controleer of de app de database kan bereiken
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testVerbinding}
            disabled={dbBezig}
          >
            {dbBezig ? "Bezig..." : "Testen"}
          </Button>
        </div>

        {dbStatus && (
          <div
            className={
              dbStatus.ok
                ? "flex items-center gap-2 rounded-xl bg-temp-good/15 px-3 py-2 text-sm font-medium text-temp-good"
                : "flex items-center gap-2 rounded-xl bg-temp-bad/15 px-3 py-2 text-sm font-medium text-temp-bad"
            }
          >
            {dbStatus.ok ? (
              <CheckCircle2 className="size-4 flex-none" aria-hidden />
            ) : (
              <XCircle className="size-4 flex-none" aria-hidden />
            )}
            {dbStatus.bericht}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Info className="size-5 text-primary" aria-hidden />
            <span className="text-base font-medium text-card-foreground">
              Appversie
            </span>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">
            {versie}
          </span>
        </div>
      </section>

      {/* Voorkeuren resetten */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <RotateCcw className="size-5 text-destructive" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              Voorkeuren resetten
            </span>
            <span className="text-sm text-muted-foreground">
              Zet weergave-instellingen terug naar de standaard
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setResetOpen(true)}
        >
          Voorkeuren resetten
        </Button>
      </section>

      <BevestigDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        titel="Voorkeuren resetten?"
        beschrijving="Donkere modus wordt uitgezet en de weergave gaat terug naar de standaardinstellingen."
        onBevestig={resetVoorkeuren}
      />
    </div>
  )
}
