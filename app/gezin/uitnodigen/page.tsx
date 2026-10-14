import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GezinUitnodiging } from "@/components/gezin-uitnodiging"
import { laadGezinsgegevens } from "@/app/actions/gezinnen"
import { createClient } from "@/lib/supabase/server"

export default async function GezinUitnodigenPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/registreren?next=${encodeURIComponent("/gezin/uitnodigen")}`)

  const gegevens = await laadGezinsgegevens()
  if (!gegevens.gezin || !gegevens.actieveCode) redirect("/")

  const code = params.code === gegevens.actieveCode.code ? params.code : gegevens.actieveCode.code

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Je bent klaar om te starten</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Nodig je partner uit</h1>
        <p className="text-muted-foreground">
          Deel de uitnodigingslink met iemand die ook toegang krijgt tot {gegevens.gezin.naam}.
        </p>
      </header>

      <GezinUitnodiging code={code} gezinNaam={gegevens.gezin.naam} />

      <Button
        className="h-12 w-full text-base"
        render={<a href="/" />}
        nativeButton={false}
      >
        Verder naar Billenboek
      </Button>
    </main>
  )
}
