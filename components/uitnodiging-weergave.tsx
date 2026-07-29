"use client"

import { useEffect, useState } from "react"
import { HeartHandshake, Mail, XCircle } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"
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
import { Spinner } from "@/components/ui/spinner"
import { otpSchema } from "@/lib/validations"

type InvitatieDetails = {
  organizationId: string
  organizationName?: string
  email?: string
  inviterEmail?: string
  status?: string
}

type Stap = "laden" | "aanmelden" | "verifieren" | "accepteren" | "fout"

export function UitnodigingWeergave({
  invitationId,
}: {
  invitationId: string
}) {
  const { data: session, isPending: sessieLaadt } = authClient.useSession()

  const [details, setDetails] = useState<InvitatieDetails | null>(null)
  const [stap, setStap] = useState<Stap>("laden")
  const [bezig, setBezig] = useState(false)
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [wachtwoord, setWachtwoord] = useState("")
  const [otp, setOtp] = useState("")

  useEffect(() => {
    authClient.organization
      .getInvitation({ query: { id: invitationId } })
      .then(({ data, error }) => {
        if (error || !data) {
          setStap("fout")
          return
        }
        const d = data as InvitatieDetails
        setDetails(d)
        if (d.email) setEmail(d.email)
      })
      .catch(() => setStap("fout"))
  }, [invitationId])

  // Zodra we weten of er al een sessie is én de uitnodigingsdetails er zijn,
  // kiezen we het juiste startscherm: al ingelogd -> meteen accepteren
  // aanbieden; nog niet ingelogd -> eerst een account laten aanmaken.
  useEffect(() => {
    if (stap === "fout" || !details || sessieLaadt) return
    setStap(session?.user ? "accepteren" : "aanmelden")
  }, [details, session, sessieLaadt, stap])

  async function accepteerUitnodiging() {
    setBezig(true)
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      })
      if (error) {
        toast.error("De uitnodiging accepteren is niet gelukt.")
        return
      }
      if (details) {
        await authClient.organization.setActive({
          organizationId: details.organizationId,
        })
      }
      window.location.href = "/"
    } finally {
      setBezig(false)
    }
  }

  async function afwijzen() {
    setBezig(true)
    try {
      await authClient.organization.rejectInvitation({ invitationId })
      window.location.href = "/login"
    } finally {
      setBezig(false)
    }
  }

  async function accountAanmaken(e: React.FormEvent) {
    e.preventDefault()
    setFoutmelding(null)
    if (!email.trim() || wachtwoord.length < 8) {
      setFoutmelding("Vul een e-mailadres en een wachtwoord van minimaal 8 tekens in.")
      return
    }
    setBezig(true)
    try {
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password: wachtwoord,
        name: email.trim(),
      })
      if (error) {
        setFoutmelding(
          /exist/i.test(error.message ?? "")
            ? "Er bestaat al een account met dit e-mailadres. Ververs de pagina en accepteer de uitnodiging via inloggen."
            : "Het aanmaken van je account is niet gelukt.",
        )
        return
      }
      setStap("verifieren")
    } finally {
      setBezig(false)
    }
  }

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
        email: email.trim(),
        otp: parsed.data.otp,
      })
      if (error) {
        setFoutmelding("De code klopt niet (meer). Vraag eventueel opnieuw aan.")
        return
      }
      await accepteerUitnodiging()
    } finally {
      setBezig(false)
    }
  }

  if (stap === "laden") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardContent className="flex justify-center py-10">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (stap === "fout") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <XCircle className="size-8" />
          </div>
          <CardTitle className="text-2xl">Ongeldige uitnodiging</CardTitle>
          <CardDescription className="text-pretty">
            Deze uitnodiging bestaat niet meer of is al gebruikt. Vraag de
            afzender om een nieuwe link te sturen.
          </CardDescription>
        </CardHeader>
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
              Bevestigen en aansluiten
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (stap === "aanmelden") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HeartHandshake className="size-8" />
          </div>
          <CardTitle className="text-2xl">Je bent uitgenodigd</CardTitle>
          <CardDescription className="text-pretty">
            Maak een account aan om je aan te sluiten bij{" "}
            <span className="font-medium text-card-foreground">
              {details?.organizationName ?? "dit gezin"}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={accountAanmaken} className="flex flex-col gap-4">
            <Field data-invalid={foutmelding ? true : undefined}>
              <FieldLabel htmlFor="email">E-mailadres</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                readOnly={Boolean(details?.email)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </Field>
            <Field data-invalid={foutmelding ? true : undefined}>
              <FieldLabel htmlFor="wachtwoord">Kies een wachtwoord</FieldLabel>
              <Input
                id="wachtwoord"
                type="password"
                autoComplete="new-password"
                required
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                className="h-12 text-base"
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
              Account aanmaken
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Heb je al een account?{" "}
            <a
              href={`/login?callbackURL=${encodeURIComponent(`/uitnodiging?invitationId=${invitationId}`)}`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Log eerst in
            </a>
          </p>
        </CardContent>
      </Card>
    )
  }

  // stap === "accepteren": gebruiker heeft al een sessie
  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartHandshake className="size-8" />
        </div>
        <CardTitle className="text-2xl">Je bent uitgenodigd</CardTitle>
        <CardDescription className="text-pretty">
          Sluit je aan bij{" "}
          <span className="font-medium text-card-foreground">
            {details?.organizationName ?? "dit gezin"}
          </span>{" "}
          op Billenboek.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="h-12 w-full" onClick={accepteerUitnodiging} disabled={bezig}>
          {bezig ? <Spinner data-icon="inline-start" /> : null}
          Uitnodiging accepteren
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full"
          onClick={afwijzen}
          disabled={bezig}
        >
          Afwijzen
        </Button>
      </CardContent>
    </Card>
  )
}
