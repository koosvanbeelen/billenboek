import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/server"
import { LoginForm } from "@/components/login-form"

export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  const { callbackURL } = await searchParams

  if (session?.user) {
    redirect(callbackURL || (session.session?.activeOrganizationId ? "/" : "/gezin/starten"))
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <LoginForm callbackURL={callbackURL || "/"} />
    </main>
  )
}
