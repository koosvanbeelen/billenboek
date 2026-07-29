"use client"

import { useState } from "react"
import Link from "next/link"
import { BookHeart } from "lucide-react"
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
import { inloggenSchema } from "@/lib/validations"

// Inloggen voor bestaande gebruikers via e-mailadres + wachtwoord. Nieuwe
// gebruikers (nog geen account/gezin) gaan via /gezin/starten, waar zowel
// het aanmaken van een account als van een gezin in één stap gebeurt.
export function LoginForm({ callbackURL = "/" }: { callbackURL?: string }) {
  const [email, setEmail] = useState("")
  const [wachtwoord, setWachtwoord] = useState("")
  const [bezig, setBezig] = useState(false)
  const [foutmelding, setFoutmelding] = useState<string | null>(null)

  async function inloggen(e: React.FormEvent) {
    e.preventDefault()
    setFoutmelding(null)

    const parsed = inloggenSchema.safeParse({ email, wachtwoord })
    if (!parsed.success) {
      setFoutmelding(parsed.error.issues[0]?.message ?? "Controleer je gegevens")
      return
    }

    setBezig(true)
    try {
      const { error } = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.wachtwoord,
      })
      if (error) {
        setFoutmelding(
          error.status === 403
            ? "Bevestig eerst je e-mailadres via de code die je bij registratie hebt gekregen."
            : "E-mailadres of wachtwoord onjuist.",
        )
        return
      }
      window.location.href = callbackURL
    } finally {
      setBezig(false)
    }
  }

  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookHeart className="size-8" />
        </div>
        <CardTitle className="text-2xl">Welkom bij Billenboek</CardTitle>
        <CardDescription className="text-pretty">
          Log in met je e-mailadres en wachtwoord.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={inloggen} className="flex flex-col gap-5">
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
              className="h-12 text-base"
            />
          </Field>
          <Field data-invalid={foutmelding ? true : undefined}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="wachtwoord" className="text-base">
                Wachtwoord
              </FieldLabel>
              <Link
                href="/wachtwoord-vergeten"
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                Vergeten?
              </Link>
            </div>
            <Input
              id="wachtwoord"
              name="wachtwoord"
              type="password"
              autoComplete="current-password"
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
            Inloggen
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Nog geen account?{" "}
          <Link
            href="/gezin/starten"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Gezin aanmaken
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
