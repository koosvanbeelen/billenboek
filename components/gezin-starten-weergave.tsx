"use client"

import { useState } from "react"
import { BabyIcon, Copy, HeartHandshake, Mail } from "lucide-react"
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
import { registrerenSchema, otpSchema } from "@/lib/validations"

type Stap = "wizard" | "verifieren" | "uitnodiging"

function slugify(naam: string) {
  const basis = naam
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${basis || "gezin"}-${suffix}`
}

/**
 * Combineert account aanmaken (e-mail + wachtwoord), gezin aanmaken en
 * optioneel direct een partner uitnodigen in één wizard. Technisch gebeurt
 * dit in deze volgorde: account aanmaken -> e-mail verifiëren met een
 * code -> gezin + kind aanmaken -> (optioneel) partner uitnodigen. Een
 * organization in Neon Auth kan namelijk pas bestaan als de aanmaker al
 * een geverifieerd, ingelogd account heeft.
 *
 * Als er al een ingelogde gebruiker is zonder gezin (bijv. een edge case
 * buiten de uitnodigingsflow om), slaat de wizard de account-stap over en
 * begint meteen bij de gezinsgegevens.
 */
export function GezinStartenWeergave({
  ingelogdEmail,
}: {
  ingelogdEmail?: string
}) {
  const [stap, setStap] = useState<Stap>(ingelogdEmail ? "wizard" : "wizard")
  const [bezig, setBezig] = useState(false)
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  const [email, setEmail] = useState(ingelogdEmail ?? "")
  const [wachtwoord, setWachtwoord] = useState("")
  const [gezinNaam, setGezinNaam] = useState("")
  const [kindNaam, setKindNaam] = useState("")
  const [geboortedatum, setGeboortedatum] = useState("")
  const [partnerEmail, setPartnerEmail] = useState("")

  const [otp, setOtp] = useState("")
  const [uitnodigingLink, setUitnodigingLink] = useState<string | null>(null)

  // Stap 1: gegevens verzamelen. Bij een nog niet ingelogde gebruiker wordt
  // hierna eerst het account aangemaakt en om een verificatiecode gevraagd.
  async function versturenWizard(e: React.FormEvent) {
    e.preventDefault()
    setFoutmelding(null)

    if (ingelogdEmail) {
      await maakGezinAan()
      return
    }

    const parsed = registrerenSchema.safeParse({
      email,
      wachtwoord,
      gezinNaam,
      kindNaam,
      geboortedatum,
      partnerEmail,
    })
    if (!parsed.success) {
      setFoutmelding(parsed.error.issues[0]?.message ?? "Controleer je gegevens")
      return
    }

    setBezig(true)
    try {
      const { error } = await authClient.signUp.email({
        email: parsed.data.email,
        password: parsed.data.wachtwoord,
        name: parsed.data.email,
      })
      if (error) {
        setFoutmelding(
          error.status === 422 || /exist/i.test(error.message ?? "")
            ? "Er bestaat al een account met dit e-mailadres. Log in plaats daarvan in."
            : "Het aanmaken van je account is niet gelukt. Probeer het opnieuw.",
        )
        return
      }
      setStap("verifieren")
    } finally {
      setBezig(false)
    }
  }

  // Stap 2: e-mailadres verifiëren met de 6-cijferige code die zonder link
  // wordt verstuurd (dus geen kans op scan-problemen door e-mailproviders).
  async function verifieren(e: React.FormEvent) {
    e.preventDefault()
    setFoutmelding(null)

    const parsed = otpSchema.safeParse({ otp })
    if (!parsed.success) {
      setFoutmelding(parsed.error.issues[0]?.message ?? "Ongeldige code")
      return
    }

    setBezig(true)
    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: parsed.data.otp,
      })
      if (error) {
        setFoutmelding("De code klopt niet (meer). Vraag eventueel opnieuw aan.")
        return
      }
      await maakGezinAan()
    } finally {
      setBezig(false)
    }
  }

  // Stap 3: gezin + kind aanmaken, gekoppeld aan de nu geverifieerde/
  // ingelogde gebruiker als owner. Optioneel meteen een partner uitnodigen.
  async function maakGezinAan() {
    setBezig(true)
    setFoutmelding(null)
    try {
      const { data, error } = await authClient.organization.create({
        name: gezinNaam.trim(),
        slug: slugify(gezinNaam),
      })
      if (error || !data) {
        setFoutmelding("Het aanmaken van je gezin is niet gelukt. Probeer het opnieuw.")
        return
      }

      await authClient.organization.setActive({ organizationId: data.id })
      await kindAanmaken({ naam: kindNaam.trim(), geboortedatum })

      if (partnerEmail.trim()) {
        const { data: uitnodiging, error: uitnodigingFout } =
          await authClient.organization.inviteMember({
            organizationId: data.id,
            email: partnerEmail.trim(),
            role: "admin",
          })
        if (!uitnodigingFout && uitnodiging) {
          setUitnodigingLink(
            `${window.location.origin}/uitnodiging?invitationId=${uitnodiging.id}`,
          )
          setStap("uitnodiging")
          return
        }
        // Uitnodiging mislukt is geen reden om de rest van het onboarden te
        // blokkeren; het gezin zelf staat dan al goed.
        toast.error(
          "Gezin aangemaakt, maar de uitnodiging voor je partner is niet gelukt. Je kunt dit later opnieuw proberen via Instellingen.",
        )
      }

      window.location.href = "/"
    } finally {
      setBezig(false)
    }
  }

  async function kopieerLink() {
    if (!uitnodigingLink) return
    await navigator.clipboard.writeText(uitnodigingLink)
    toast.success("Link gekopieerd")
  }

  if (stap === "uitnodiging" && uitnodigingLink) {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HeartHandshake className="size-8" />
          </div>
          <CardTitle className="text-2xl">Gezin aangemaakt</CardTitle>
          <CardDescription className="text-pretty">
            Deel deze link met je partner om diegene toe te voegen aan
            jullie gezin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
          <Button className="h-12 w-full" onClick={() => (window.location.href = "/")}>
            Naar Billenboek
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (stap === "verifieren") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="size-8" />
          </div>
          <CardTitle className="text-2xl">Vul de code in</CardTitle>
          <CardDescription className="text-pretty">
            We hebben een 6-cijferige code gestuurd naar{" "}
            <span className="font-medium text-card-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={verifieren} className="flex flex-col gap-5">
            <Field data-invalid={foutmelding ? true : undefined}>
              <FieldLabel htmlFor="otp" className="text-base">
                Verificatiecode
              </FieldLabel>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-center text-lg tracking-[0.3em]"
              />
              {foutmelding ? (
                <p className="text-sm text-destructive" role="alert">
                  {foutmelding}
                </p>
              ) : null}
            </Field>
            <Button
              type="submit"
              size="lg"
              className="h-14 w-full text-base"
              disabled={bezig}
            >
              {bezig ? <Spinner data-icon="inline-start" /> : null}
              Bevestigen
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BabyIcon className="size-8" />
        </div>
        <CardTitle className="text-2xl">Maak je gezin aan</CardTitle>
        <CardDescription className="text-pretty">
          {ingelogdEmail
            ? "Geef je gezin een naam en vul de gegevens van je baby in."
            : "Eén formulier: je account, je gezin, en optioneel je partner."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={versturenWizard} className="flex flex-col gap-4">
          {!ingelogdEmail && (
            <>
              <Field data-invalid={foutmelding ? true : undefined}>
                <FieldLabel htmlFor="email">Jouw e-mailadres</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                />
              </Field>
              <Field data-invalid={foutmelding ? true : undefined}>
                <FieldLabel htmlFor="wachtwoord">Wachtwoord</FieldLabel>
                <Input
                  id="wachtwoord"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={wachtwoord}
                  onChange={(e) => setWachtwoord(e.target.value)}
                  className="h-12 text-base"
                />
              </Field>
              <Separator />
            </>
          )}

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

          <Separator />

          <Field>
            <FieldLabel htmlFor="partnerEmail">
              E-mailadres partner (optioneel)
            </FieldLabel>
            <Input
              id="partnerEmail"
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="Later toevoegen kan ook via Instellingen"
              className="h-12 text-base"
            />
          </Field>

          {foutmelding ? (
            <p className="text-sm text-destructive" role="alert">
              {foutmelding}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full text-base"
            disabled={bezig}
          >
            {bezig ? <Spinner data-icon="inline-start" /> : null}
            {ingelogdEmail ? "Gezin aanmaken" : "Account en gezin aanmaken"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
