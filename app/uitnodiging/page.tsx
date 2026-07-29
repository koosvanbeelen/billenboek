import { UitnodigingWeergave } from "@/components/uitnodiging-weergave"

export const dynamic = "force-dynamic"

export default async function UitnodigingPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>
}) {
  const { invitationId } = await searchParams

  if (!invitationId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-muted-foreground">Ongeldige uitnodigingslink.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <UitnodigingWeergave invitationId={invitationId} />
    </main>
  )
}
