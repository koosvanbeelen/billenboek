"use client"

import { useState } from "react"
import { BookHeart, CheckCircle2 } from "lucide-react"
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

type Status = "invoeren" | "versturen" | "verzonden" | "fout"

export function LoginForm({ callbackURL = "/" }: { callbackURL?: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("invoeren")
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  async function verstuurMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setStatus("versturen")
    setFoutmelding(null)

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL,
    })

    if (error) {
      setStatus("fout")
      setFoutmelding(
        "Het versturen van de inloglink is niet gelukt. Probeer het opnieuw.",
      )
      return
    }

    setStatus("verzonden")
  }

  if (status === "verzonden") {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-temp-good/15 text-temp-good">
            <CheckCircle2 className="size-8" />
          </div>
          <CardTitle className="text-2xl">Check je e-mail</CardTitle>
          <CardDescription className="text-pretty">
            We hebben een inloglink gestuurd naar{" "}
            <span className="font-medium text-card-foreground">{email}</span>.
            Klik op de link om verder te gaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => setStatus("invoeren")}
          >
            Ander e-mailadres gebruiken
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookHeart className="size-8" />
        </div>
        <CardTitle className="text-2xl">Welkom bij Billenboek</CardTitle>
        <CardDescription className="text-pretty">
          Vul je e-mailadres in om een inloglink te ontvangen. Geen
          wachtwoord nodig.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={verstuurMagicLink} className="flex flex-col gap-5">
          <Field data-invalid={foutmelding ? true : undefined}>
            <FieldLabel htmlFor="email" className="text-base">
              E-mailadres
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={foutmelding ? true : undefined}
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
            disabled={status === "versturen"}
          >
            {status === "versturen" ? <Spinner data-icon="inline-start" /> : null}
            Stuur inloglink
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
