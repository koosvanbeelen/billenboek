import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/server"
import { GezinStartenWeergave } from "@/components/gezin-starten-weergave"

export const dynamic = "force-dynamic"

export default async function GezinStartenPage() {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.session?.activeOrganizationId) {
    redirect("/")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <GezinStartenWeergave email={session.user.email ?? ""} />
    </main>
  )
}
