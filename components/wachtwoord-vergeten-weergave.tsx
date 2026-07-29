"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyRound, CheckCircle2 } from "lucide-react"
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
import {
  wachtwoordVergetenSchema,
  wachtwoordResetSchema,
} from "@/lib/validations"

type Stap = "email" | "reset" | "klaar"

export function WachtwoordVergetenWeergave() {
  const [stap, setStap] = useState<Stap>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [wachtwoord, setWachtwoord] = useState("")
  const [bezig, setBezig] = useState(false)
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  async function verstuurCode(e: React.FormEvent) {
    e.preventDefault()
    setFoutmelding(null)
    const parsed = wachtwoordVergetenSchema.safeParse({ email })
    if (!parsed.success) {
      setFoutmelding(parsed.error.issues[0]?.message ?? "Ongeldig e-mailadres")
      return
    }
    setBezig(true)
    try {
      const { error } = await authClient.forgetPassword.emailOtp({
        email: parsed.data.email,
      })
      if (error) {
        setFoutmelding("Versturen is niet gelukt. Controleer het e-mailadres.")
        return
      }
      setStap("reset")
    } finally {
      setBezig(false)
    }
  }

  async function stelNieuwWachtwoordIn(e: React.FormEvent) {
    e.preventDefault()
    setFoutmelding(null)
    const parsed = wachtwoordResetSchema.safeParse({ otp, wachtwoord })
    if (!parsed.success) {
      setFoutmelding(parsed.error.issues[0]?.message ?? "Controleer je gegevens")
      return
    }
    setBezig(true)
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp: parsed.data.otp,
        password: parsed.data.wachtwoord,
      })
      if (error) {
        setFoutmelding("De code klopt niet (meer). Vraag eventueel een nieuwe aan.")
        return
      }
      setStap("klaar")
      toast.success("Wachtwoord gewijzigd")
    } finally {
      setBezig(false)
    }
  }

  if (stap === "klaar") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-temp-good/15 text-temp-good">
            <CheckCircle2 className="size-8" />
          </div>
          <CardTitle className="text-2xl">Wachtwoord gewijzigd</CardTitle>
          <CardDescription className="text-pretty">
            Je kunt nu inloggen met je nieuwe wachtwoord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/login" />} className="h-12 w-full">
            Naar inloggen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (stap === "reset") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="size-8" />
          </div>
          <CardTitle className="text-2xl">Vul de code in</CardTitle>
          <CardDescription className="text-pretty">
            We hebben een 6-cijferige code gestuurd naar{" "}
            <span className="font-medium text-card-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={stelNieuwWachtwoordIn} className="flex flex-col gap-5">
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
            </Field>
            <Field data-invalid={foutmelding ? true : undefined}>
              <FieldLabel htmlFor="nieuw-wachtwoord" className="text-base">
                Nieuw wachtwoord
              </FieldLabel>
              <Input
                id="nieuw-wachtwoord"
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
              Wachtwoord instellen
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
          <KeyRound className="size-8" />
        </div>
        <CardTitle className="text-2xl">Wachtwoord vergeten</CardTitle>
        <CardDescription className="text-pretty">
          Vul je e-mailadres in, dan sturen we een verificatiecode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={verstuurCode} className="flex flex-col gap-5">
          <Field data-invalid={foutmelding ? true : undefined}>
            <FieldLabel htmlFor="email" className="text-base">
              E-mailadres
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Code versturen
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Terug naar inloggen
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
