"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Moon,
  Info,
  CheckCircle2,
  Smartphone,
  Share,
  ArrowDownNarrowWide,
  ListChecks,
  ChevronRight,
  UserRound,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { usePwaInstall } from "@/components/pwa-install-provider"
import { useTijdlijnVolgorde } from "@/lib/tijdlijn-voorkeur"
export function InstellingenWeergave() {
  // Voorkomt een hydration-mismatch: het thema is pas na mount bekend.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { theme, setTheme } = useTheme()
  const { installable, installed, isIos, promptInstall } = usePwaInstall()
  const [volgorde, setVolgorde] = useTijdlijnVolgorde()

  const [installBezig, setInstallBezig] = useState(false)

  async function installeerApp() {
    setInstallBezig(true)
    try {
      const uitkomst = await promptInstall()
      if (uitkomst === "accepted") {
        toast.success("Billenboek wordt geïnstalleerd")
      } else if (uitkomst === "unavailable") {
        toast.error("Installeren is nu niet beschikbaar in deze browser")
      }
    } finally {
      setInstallBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Instellingen
      </h1>

      {/* Gezin (submenu) */}
      <Link
        href="/instellingen/gezin"
        className="order-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
      >
        <UsersRound className="size-5 text-primary" aria-hidden />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-medium text-card-foreground">Gezin</span>
          <span className="text-sm text-muted-foreground">
            Kinderen, leden en uitnodigingslink beheren
          </span>
        </div>
        <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>

      {/* Account (submenu) */}
      <Link
        href="/instellingen/account"
        className="order-1 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
      >
        <UserRound className="size-5 text-primary" aria-hidden />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-medium text-card-foreground">Account</span>
          <span className="text-sm text-muted-foreground">
            Naam, wachtwoord, uitloggen en account verwijderen
          </span>
        </div>
        <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>

      {/* Formulieren en tellers (submenu) */}
      <Link
        href="/instellingen/formulieren-en-tellers"
        className="order-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
      >
        <ListChecks className="size-5 text-primary" aria-hidden />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-medium text-card-foreground">
            Formulieren en tellers
          </span>
          <span className="text-sm text-muted-foreground">
            Kies welke registraties en tellers je gebruikt
          </span>
        </div>
        <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>

      {/* App-info (submenu) */}
      <Link
        href="/instellingen/app-info"
        className="order-7 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent"
      >
        <Info className="size-5 text-primary" aria-hidden />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-medium text-card-foreground">App-info</span>
          <span className="text-sm text-muted-foreground">
            Versie, databaseverbinding en technische ID's
          </span>
        </div>
        <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>

      {/* Tijdlijn */}
      <section className="order-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArrowDownNarrowWide className="size-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="text-base font-medium text-card-foreground">
                Nieuwste eerst
              </span>
              <span className="text-sm text-muted-foreground">
                Bepaal de volgorde van je tijdlijn
              </span>
            </div>
          </div>
          {mounted ? (
            <Switch
              checked={volgorde === "nieuw-oud"}
              onCheckedChange={(checked) =>
                setVolgorde(checked ? "nieuw-oud" : "oud-nieuw")
              }
              aria-label="Nieuwste eerst aan of uit"
            />
          ) : (
            <div className="h-[18.4px] w-[32px]" aria-hidden />
          )}
        </div>
      </section>

      {/* Weergave */}
      <section className="order-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
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

      {/* App installeren */}
      <section className="order-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Smartphone className="size-5 text-primary" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              App installeren
            </span>
            <span className="text-sm text-muted-foreground">
              Zet Billenboek op je startscherm voor snelle toegang
            </span>
          </div>
        </div>

        {installed ? (
          <div className="flex items-center gap-2 rounded-xl bg-temp-good/15 px-3 py-2 text-sm font-medium text-temp-good">
            <CheckCircle2 className="size-4 flex-none" aria-hidden />
            Billenboek is al geïnstalleerd op dit apparaat
          </div>
        ) : installable ? (
          <Button onClick={installeerApp} disabled={installBezig}>
            {installBezig ? "Bezig..." : "Installeer app"}
          </Button>
        ) : isIos ? (
          <div className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Share className="size-4 flex-none translate-y-0.5" aria-hidden />
            <span>
              Tik op <strong className="text-card-foreground">Deel</strong> onderin Safari en kies
              vervolgens <strong className="text-card-foreground">Zet op beginscherm</strong>.
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Installeren wordt niet ondersteund in deze browser.
          </p>
        )}

      </section>

    </div>
  )
}
