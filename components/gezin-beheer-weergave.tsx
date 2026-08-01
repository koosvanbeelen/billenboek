"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Users,
  UserPlus,
  Baby,
  LogOut,
  Copy,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"
import { uitloggen } from "@/app/actions/auth"
import { kindAanmaken, kinderenOphalen } from "@/app/actions/gezin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BevestigDialog } from "@/components/bevestig-dialog"
import type { Kind } from "@/lib/db/schema"

const rolLabel: Record<string, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  member: "Lid",
}

export function GezinBeheerWeergave() {
  const { data: organisatie, isPending: organisatieLaadt } =
    authClient.useActiveOrganization()

  const leden = (organisatie?.members ?? []) as {
    id: string
    role: string
    user: { name: string; email: string }
  }[]

  // Uitnodigen
  const [email, setEmail] = useState("")
  const [uitnodigingBezig, setUitnodigingBezig] = useState(false)
  const [uitnodigingLink, setUitnodigingLink] = useState<string | null>(null)
  const [uitnodigingFout, setUitnodigingFout] = useState<string | null>(null)

  async function uitnodigen(e: React.FormEvent) {
    e.preventDefault()
    if (!organisatie || !email.trim()) return
    setUitnodigingFout(null)
    setUitnodigingBezig(true)
    setUitnodigingLink(null)
    try {
      const { data, error } = await authClient.organization.inviteMember({
        organizationId: organisatie.id,
        email: email.trim(),
        role: "admin",
      })
      if (error || !data) {
        setUitnodigingFout(
          /exist|pending/i.test(error?.message ?? "")
            ? "Er staat al een openstaande uitnodiging voor dit e-mailadres."
            : "Uitnodigen is niet gelukt. Probeer het opnieuw.",
        )
        return
      }
      setUitnodigingLink(
        `${window.location.origin}/uitnodiging?invitationId=${data.id}`,
      )
      setEmail("")
    } finally {
      setUitnodigingBezig(false)
    }
  }

  async function kopieerLink() {
    if (!uitnodigingLink) return
    await navigator.clipboard.writeText(uitnodigingLink)
    toast.success("Link gekopieerd")
  }

  // Kinderen
  const [kinderen, setKinderen] = useState<Kind[]>([])
  const [kinderenLaden, setKinderenLaden] = useState(true)
  const [kindDialogOpen, setKindDialogOpen] = useState(false)
  const [kindNaam, setKindNaam] = useState("")
  const [kindGeboortedatum, setKindGeboortedatum] = useState("")
  const [kindOpslaan, kindTransitie] = useTransition()

  useEffect(() => {
    kinderenOphalen()
      .then(setKinderen)
      .finally(() => setKinderenLaden(false))
  }, [])

  function kindToevoegen(e: React.FormEvent) {
    e.preventDefault()
    if (!kindNaam.trim()) return
    kindTransitie(async () => {
      await kindAanmaken({ naam: kindNaam.trim(), geboortedatum: kindGeboortedatum })
      setKinderen(await kinderenOphalen())
      setKindNaam("")
      setKindGeboortedatum("")
      setKindDialogOpen(false)
      toast.success("Kind toegevoegd")
    })
  }

  // Uitloggen
  const [uitloggenOpen, setUitloggenOpen] = useState(false)
  const [uitloggenBezig, setUitloggenBezig] = useState(false)

  async function bevestigUitloggen() {
    setUitloggenBezig(true)
    await uitloggen()
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-semibold text-foreground">
        Account & gezin
      </h1>

      {/* Gezinsleden */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Users className="size-5 text-primary" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">
              {organisatie?.name ?? "Gezin"}
            </span>
            <span className="text-sm text-muted-foreground">
              Gezinsleden die toegang hebben tot Billenboek
            </span>
          </div>
        </div>

        {organisatieLaadt ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {leden.map((lid) => (
              <li
                key={lid.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-card-foreground">
                    {lid.user.name || lid.user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">{lid.user.email}</span>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {rolLabel[lid.role] ?? lid.role}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <form onSubmit={uitnodigen} className="flex flex-col gap-3">
          <Field data-invalid={uitnodigingFout ? true : undefined}>
            <FieldLabel htmlFor="uitnodig-email" className="text-base">
              Nodig iemand uit
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="uitnodig-email"
                type="email"
                placeholder="naam@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 flex-1 text-base"
              />
              <Button type="submit" disabled={uitnodigingBezig || !email.trim()}>
                {uitnodigingBezig ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <UserPlus className="size-4" aria-hidden />
                )}
                Uitnodigen
              </Button>
            </div>
            {uitnodigingFout ? (
              <p className="text-sm text-destructive" role="alert">
                {uitnodigingFout}
              </p>
            ) : null}
          </Field>
        </form>

        {uitnodigingLink ? (
          <div className="flex flex-col gap-2 rounded-xl bg-primary/5 p-3">
            <span className="text-sm text-muted-foreground">
              Deel deze link met de uitgenodigde persoon:
            </span>
            <div className="flex items-center gap-2">
              <Input readOnly value={uitnodigingLink} className="h-10 text-sm" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={kopieerLink}
                aria-label="Link kopiëren"
              >
                <Copy className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {/* Kinderen */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Baby className="size-5 text-primary" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">Kinderen</span>
            <span className="text-sm text-muted-foreground">
              Baby&apos;s die in dit gezin worden bijgehouden
            </span>
          </div>
        </div>

        {kinderenLaden ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : kinderen.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {kinderen.map((kind) => (
              <li
                key={kind.id}
                className="flex flex-col rounded-xl bg-muted px-3 py-2"
              >
                <span className="text-sm font-medium text-card-foreground">{kind.naam}</span>
                {kind.geboortedatum ? (
                  <span className="text-xs text-muted-foreground">
                    Geboren {kind.geboortedatum}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nog geen kinderen toegevoegd.</p>
        )}

        <Dialog open={kindDialogOpen} onOpenChange={setKindDialogOpen}>
          <DialogTrigger render={<Button variant="outline" />}>
            Kind toevoegen
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Kind toevoegen</DialogTitle>
              <DialogDescription>
                Voeg een baby toe aan dit gezin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={kindToevoegen} className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="kind-naam">Naam</FieldLabel>
                <Input
                  id="kind-naam"
                  value={kindNaam}
                  onChange={(e) => setKindNaam(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kind-geboortedatum">
                  Geboortedatum (optioneel)
                </FieldLabel>
                <Input
                  id="kind-geboortedatum"
                  type="date"
                  value={kindGeboortedatum}
                  onChange={(e) => setKindGeboortedatum(e.target.value)}
                  className="h-12 text-base"
                />
              </Field>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Annuleren
                </DialogClose>
                <Button type="submit" disabled={kindOpslaan || !kindNaam.trim()}>
                  {kindOpslaan ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Toevoegen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      {/* Uitloggen */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <LogOut className="size-5 text-destructive" aria-hidden />
          <div className="flex flex-col">
            <span className="text-base font-medium text-card-foreground">Uitloggen</span>
            <span className="text-sm text-muted-foreground">
              Je moet daarna opnieuw inloggen om Billenboek te gebruiken
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setUitloggenOpen(true)}
        >
          Uitloggen
        </Button>
      </section>

      <BevestigDialog
        open={uitloggenOpen}
        onOpenChange={setUitloggenOpen}
        titel="Uitloggen?"
        beschrijving="Je wordt teruggestuurd naar het inlogscherm."
        bevestigLabel={uitloggenBezig ? "Bezig..." : "Uitloggen"}
        onBevestig={bevestigUitloggen}
      />
    </div>
  )
}
