"use client"

import { useState } from "react"
import { CheckCircle2, DatabaseZap, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { controleerDatabase } from "@/app/actions/systeem"
import type { AppInfo } from "@/app/actions/app-info"

function waarde(value: string | null | undefined) {
  return value || "-"
}

export function AppInfoWeergave({ info }: { info: AppInfo }) {
  const [bezig, setBezig] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; bericht: string } | null>(null)

  async function testVerbinding() {
    setBezig(true)
    setStatus(null)
    try {
      setStatus(await controleerDatabase())
    } catch {
      setStatus({ ok: false, bericht: "Geen verbinding met de database." })
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Info className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-medium text-card-foreground">Applicatie</h2>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Appversie</dt><dd className="font-medium">{waarde(info.versie)}</dd></div>
        </dl>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DatabaseZap className="size-5 text-primary" aria-hidden />
            <h2 className="text-base font-medium text-card-foreground">Databaseverbinding</h2>
          </div>
          <Button variant="outline" size="sm" onClick={testVerbinding} disabled={bezig}>
            {bezig ? "Bezig..." : "Testen"}
          </Button>
        </div>
        {status && (
          <div className={status.ok ? "flex items-center gap-2 rounded-xl bg-temp-good/15 px-3 py-2 text-sm font-medium text-temp-good" : "flex items-center gap-2 rounded-xl bg-temp-bad/15 px-3 py-2 text-sm font-medium text-temp-bad"}>
            {status.ok ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
            {status.bericht}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <DatabaseZap className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-medium text-card-foreground">Gebruiker, Gezin en Kinderen</h2>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <div><dt className="text-muted-foreground">User ID</dt><dd className="break-all font-mono text-xs">{waarde(info.userId)}</dd></div>
          <div><dt className="text-muted-foreground">Gezin ID</dt><dd className="break-all font-mono text-xs">{waarde(info.gezinId)}</dd></div>
          <div>
            <dt className="text-muted-foreground">Kind ID&apos;s</dt>
            <dd className="mt-1 flex flex-col gap-1 font-mono text-xs">
              {info.kinderen.length > 0 ? info.kinderen.map((kind) => <span key={kind.id}>{kind.id} ({kind.naam})</span>) : "-"}
            </dd>
          </div>
        </dl>
      </section>

    </div>
  )
}
