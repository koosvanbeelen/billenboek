import { redirect } from "next/navigation"
import { KindOnboarding } from "@/components/kind-onboarding"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { getKinderen } from "@/lib/supabase/kind"
import { getGebruiker } from "@/lib/supabase/server"

// Stap na het aanmaken van of deelnemen aan een gezin: minimaal één kind toevoegen.
export default async function KindToevoegenPage() {
  if (!(await getGebruiker())) redirect("/login?next=%2Fgezin%2Fkind")

  let heeftGezin = false
  try {
    await getActiefGezinId()
    heeftGezin = true
  } catch {}
  if (!heeftGezin) redirect("/gezin/onboarding")

  // Er is al een kind: niets meer te doen.
  if ((await getKinderen()).length > 0) redirect("/")

  return <KindOnboarding />
}
