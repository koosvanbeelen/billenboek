"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BabyIcon, HeartHandshake, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"
import { kindAanmaken } from "@/app/actions/gezin"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

type Uitnodiging = {
  id: string
  organizationId: string
  organizationName?: string
  inviterEmail?: string
}

function slugify(naam: string) {
  const basis = naam
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${basis || "gezin"}-${suffix}`
}

export function GezinStartenWeergave({ email }: { email: string }) {
  const router = useRouter()
  const [uitnodigingen, setUitnodigingen] = useState<Uitnodiging[] | null>(null)
  const [bezigMetId, setBezigMetId] = useState<string | null>(null)

  const [gezinNaam, setGezinNaam] = useState("")
  const [kindNaam, setKindNaam] = useState("")
  const [geboortedatum, setGeboortedatum] = useState("")
  const [aanmakenBezig, setAanmakenBezig] = useState(false)

  useEffect(() => {
    authClient.organization
      .listUserInvitations()
      .then(({ data }) => setUitnodigingen((data as Uitnodiging[]) ?? []))
      .catch(() => setUitnodigingen([]))
  }, [])

  async function accepteerUitnodiging(inv: Uitnodiging) {
    setBezigMetId(inv.id)
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId: inv.id,
      })
      if (error) {
        toast.error("De uitnodiging accepteren is niet gelukt.")
        return
      }
      await authClient.organization.setActive({
        organizationId: inv.organizationId,
      })
      // Volledige paginaverversing zodat de server de zojuist bijgewerkte
      // sessie (met actief gezin) opnieuw ophaalt.
      window.location.href = "/"
    } finally {
      setBezigMetId(null)
    }
  }

  async function maakGezinAan(e: React.FormEvent) {
    e.preventDefault()
    if (!gezinNaam.trim() || !kindNaam.trim()) return
    setAanmakenBezig(true)
    try {
      const { data, error } = await authClient.organization.create({
        name: gezinNaam.trim(),
        slug: slugify(gezinNaam),
      })
      if (error || !data) {
        toast.error("Het aanmaken van je gezin is niet gelukt. Probeer het opnieuw.")
        return
      }

      await authClient.organization.setActive({ organizationId: data.id })
      await kindAanmaken({ naam: kindNaam.trim(), geboortedatum })

      window.location.href = "/"
    } finally {
      setAanmakenBezig(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      {uitnodigingen === null ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : uitnodigingen.length > 0 ? (
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartHandshake className="size-8" />
            </div>
            <CardTitle className="text-2xl">Je bent uitgenodigd</CardTitle>
            <CardDescription className="text-pretty">
              Sluit je aan bij het gezin waarvoor je bent uitgenodigd.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {uitnodigingen.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm font-medium text-card-foreground">
                    {inv.organizationName ?? "Gezin"}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => accepteerUitnodiging(inv)}
                  disabled={bezigMetId === inv.id}
                >
                  {bezigMetId === inv.id ? <Spinner data-icon="inline-start" /> : null}
                  Aansluiten
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {(uitnodigingen === null || uitnodigingen.length === 0) && (
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BabyIcon className="size-8" />
            </div>
            <CardTitle className="text-2xl">Maak je gezin aan</CardTitle>
            <CardDescription className="text-pretty">
              Welkom, {email}. Geef je gezin een naam en vul de gegevens van
              je baby in om te beginnen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={maakGezinAan} className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="gezinNaam">Naam van je gezin</FieldLabel>
                <Input
                  id="gezinNaam"
                  value={gezinNaam}
                  onChange={(e) => setGezinNaam(e.target.value)}
                  placeholder="Bijv. Familie Van Beelen"
                  required
                  className="h-12 text-base"
                />
              </Field>
              <Separator />
              <Field>
                <FieldLabel htmlFor="kindNaam">Naam van je baby</FieldLabel>
                <Input
                  id="kindNaam"
                  value={kindNaam}
                  onChange={(e) => setKindNaam(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="geboortedatum">
                  Geboortedatum (optioneel)
                </FieldLabel>
                <Input
                  id="geboortedatum"
                  type="date"
                  value={geboortedatum}
                  onChange={(e) => setGeboortedatum(e.target.value)}
                  className="h-12 text-base"
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                className="h-14 w-full text-base"
                disabled={aanmakenBezig}
              >
                {aanmakenBezig ? <Spinner data-icon="inline-start" /> : null}
                Gezin aanmaken
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
