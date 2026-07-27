"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  LogOut,
  Mail,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { uitloggen } from "@/app/actions/auth"
import { authClient } from "@/lib/auth/client"
import { Badge } from "@/components/ui/badge"
import { BevestigDialog } from "@/components/bevestig-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

type Lid = {
  id: string
  role: string
  user: { email: string; name?: string }
}

const rolLabel: Record<string, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  member: "Lid",
}

export function GezinBeheer() {
  const { data: session } = authClient.useSession()
  const { data: organisatie, isPending: orgLaadt } =
    authClient.useActiveOrganization()

  const [uitnodigenOpen, setUitnodigenOpen] = useState(false)
  const [uitloggenBezig, setUitloggenBezig] = useState(false)
  const [teVerwijderen, setTeVerwijderen] = useState<Lid | null>(null)
  const [verwijderenBezig, setVerwijderenBezig] = useState(false)

  const [email, setEmail] = useState("")
  const [versturenBezig, setVersturenBezig] = useState(false)
  const [uitnodigingLink, setUitnodigingLink] = useState<string | null>(null)

  async function verstuurUitnodiging(e: React.FormEvent) {
    e.preventDefault()
    if (!organisatie) return
    setVersturenBezig(true)
    setUitnodigingLink(null)
    try {
      const { data, error } = await authClient.organization.inviteMember({
        organizationId: organisatie.id,
        email: email.trim(),
        role: "admin",
      })
      if (error || !data) {
        toast.error("De uitnodiging aanmaken is niet gelukt. Probeer het opnieuw.")
        return
      }
      const link = `${window.location.origin}/uitnodiging?invitationId=${data.id}`
      setUitnodigingLink(link)
    } finally {
      setVersturenBezig(false)
    }
  }

  async function kopieerLink() {
    if (!uitnodigingLink) return
    await navigator.clipboard.writeText(uitnodigingLink)
    toast.success("Link gekopieerd")
  }

  function sluitUitnodigenDialog(open: boolean) {
    setUitnodigenOpen(open)
    if (!open) {
      setEmail("")
      setUitnodigingLink(null)
    }
  }

  async function verwijderLid() {
    if (!teVerwijderen) return
    setVerwijderenBezig(true)
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: teVerwijderen.id,
      })
      if (error) {
        toast.error("Het verwijderen van dit gezinslid is niet gelukt.")
        return
      }
      toast.success("Gezinslid verwijderd")
      setTeVerwijderen(null)
      window.location.reload()
    } finally {
      setVerwijderenBezig(false)
    }
  }

  async function verwerkUitloggen() {
    setUitloggenBezig(true)
    try {
      await uitloggen()
    } finally {
      setUitloggenBezig(false)
    }
  }

  const leden = (organisatie?.members ?? []) as Lid[]

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Users className="size-5 text-primary" aria-hidden />
        <div className="flex flex-col">
          <span className="text-base font-medium text-card-foreground">
            Account &amp; gezin
          </span>
          <span className="text-sm text-muted-foreground">
            {session?.user?.email ?? "…"}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-card-foreground">
          {orgLaadt ? "Gezin wordt geladen…" : organisatie?.name ?? "Gezin"}
        </span>
        {!orgLaadt && leden.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {leden.map((lid) => {
              const isEigenAccount = lid.user.email === session?.user?.email
              return (
                <div
                  key={lid.id}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <span className="truncate text-sm text-card-foreground">
                    {lid.user.name || lid.user.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {rolLabel[lid.role] ?? lid.role}
                    </Badge>
                    {!isEigenAccount && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setTeVerwijderen(lid)}
                        aria-label={`${lid.user.name || lid.user.email} verwijderen`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setUitnodigenOpen(true)}
      >
        <UserPlus className="size-4" aria-hidden />
        Partner uitnodigen
      </Button>

      <Separator />

      <Button
        variant="outline"
        className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={verwerkUitloggen}
        disabled={uitloggenBezig}
      >
        {uitloggenBezig ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LogOut className="size-4" aria-hidden />
        )}
        Uitloggen
      </Button>

      <Dialog open={uitnodigenOpen} onOpenChange={sluitUitnodigenDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Partner uitnodigen</DialogTitle>
            <DialogDescription>
              Vul het e-mailadres van je partner in. Je krijgt daarna een link
              die je zelf kunt delen (bijv. via appje of e-mail).
            </DialogDescription>
          </DialogHeader>

          {uitnodigingLink ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-temp-good/15 px-3 py-2 text-sm font-medium text-temp-good">
                <Mail className="size-4 flex-none" aria-hidden />
                Uitnodiging aangemaakt
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly value={uitnodigingLink} className="h-11 text-sm" />
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
              <p className="text-sm text-muted-foreground">
                Deel deze link met je partner. Zodra die de link opent en
                inlogt, wordt hij of zij toegevoegd aan jullie gezin.
              </p>
            </div>
          ) : (
            <form onSubmit={verstuurUitnodiging} className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="uitnodigen-email">E-mailadres</FieldLabel>
                <Input
                  id="uitnodigen-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                />
              </Field>
              <Button type="submit" className="h-12 w-full" disabled={versturenBezig}>
                {versturenBezig ? <Spinner data-icon="inline-start" /> : null}
                Uitnodigingslink maken
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <BevestigDialog
        open={teVerwijderen !== null}
        onOpenChange={(open) => !open && setTeVerwijderen(null)}
        titel="Gezinslid verwijderen"
        beschrijving={`Weet je zeker dat je ${
          teVerwijderen?.user.name || teVerwijderen?.user.email
        } wilt verwijderen uit jullie gezin? Deze persoon verliest direct toegang tot alle gegevens.`}
        bevestigLabel={verwijderenBezig ? "Bezig…" : "Verwijderen"}
        onBevestig={verwijderLid}
      />
    </section>
  )
}
