"use client"

import { useEffect, useState } from "react"
import { HeartHandshake, XCircle } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"

type InvitatieDetails = {
  organizationId: string
  organizationName?: string
  inviterEmail?: string
  status?: string
}

export function UitnodigingWeergave({
  invitationId,
}: {
  invitationId: string
}) {
  const [details, setDetails] = useState<InvitatieDetails | null | "fout">(
    null,
  )
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    authClient.organization
      .getInvitation({ query: { id: invitationId } })
      .then(({ data, error }) => {
        if (error || !data) {
          setDetails("fout")
          return
        }
        setDetails(data as InvitatieDetails)
      })
      .catch(() => setDetails("fout"))
  }, [invitationId])

  async function accepteren() {
    setBezig(true)
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      })
      if (error) {
        toast.error("De uitnodiging accepteren is niet gelukt.")
        return
      }
      if (details && details !== "fout") {
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
      window.location.href = "/gezin/starten"
    } finally {
      setBezig(false)
    }
  }

  if (details === null) {
    return (
      <Card className="w-full max-w-sm rounded-3xl shadow-sm">
        <CardContent className="flex justify-center py-10">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (details === "fout") {
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
            {details.organizationName ?? "dit gezin"}
          </span>{" "}
          op Billenboek.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="h-12 w-full" onClick={accepteren} disabled={bezig}>
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
