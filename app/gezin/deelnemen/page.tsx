import { redirect } from "next/navigation"
import { GezinOnboarding } from "@/components/gezin-onboarding"
import { neemDeelMetCode } from "@/app/actions/gezinnen"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { createClient } from "@/lib/supabase/server"

export default async function DeelnemenPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  const code = params.code?.trim()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const next = `/gezin/deelnemen${code ? `?code=${encodeURIComponent(code)}` : ""}`
  if (!user) redirect(`/registreren?next=${encodeURIComponent(next)}`)

  // Een uitnodigingslink bevat al de koppeling naar het bestaande gezin. De RPC
  // haalt het gezin_id op via de code en maakt alleen het gezinslid (user_id) aan.
  // Het bestaande kind wordt daarna automatisch het actieve kind in de app.
  if (code) {
    const resultaat = await neemDeelMetCode(code)
    if (resultaat.ok) redirect("/")

    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-4 px-4 py-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Uitnodiging mislukt</h1>
        <p className="text-muted-foreground">{resultaat.fout}</p>
        <a className="font-medium text-primary underline underline-offset-4" href="/">
          Terug naar Billenboek
        </a>
      </main>
    )
  }

  let heeftGezin = false
  try { await getActiefGezinId(); heeftGezin = true } catch {}
  if (heeftGezin) redirect("/")
  return <GezinOnboarding />
}
