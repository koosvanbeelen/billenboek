import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/server"
import { LoginForm } from "@/components/login-form"
import { UitnodigingWeergave } from "@/components/uitnodiging-weergave"

export const dynamic = "force-dynamic"

export default async function UitnodigingPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>
}) {
  const { invitationId } = await searchParams
  const { data: session } = await auth.getSession()

  if (!invitationId) {
    redirect("/login")
  }

  if (!session?.user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <LoginForm callbackURL={`/uitnodiging?invitationId=${invitationId}`} />
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <UitnodigingWeergave invitationId={invitationId} />
    </main>
  )
}
