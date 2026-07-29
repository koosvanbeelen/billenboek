import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/server"
import { GezinStartenWeergave } from "@/components/gezin-starten-weergave"

export const dynamic = "force-dynamic"

export default async function GezinStartenPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.session?.activeOrganizationId) {
    redirect("/")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <GezinStartenWeergave ingelogdEmail={session?.user?.email ?? undefined} />
    </main>
  )
}
