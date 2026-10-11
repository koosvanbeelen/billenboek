import { cache } from "react"
import { createClient, getGebruiker } from "@/lib/supabase/server"

// Het gezin van de ingelogde gebruiker, één keer per verzoek opgehaald (de layout, de pagina
// en de acties delen het resultaat). Gooit een fout als je niet bent ingelogd of nog geen
// gezin hebt.
export const getActiefGezinId = cache(async (): Promise<string> => {
  const user = await getGebruiker()
  if (!user) throw new Error("Je moet ingelogd zijn.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gezin_leden")
    .select("gezin_id")
    .eq("user_id", user.id)
    .order("aangemaakt_op", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error("Gezin kon niet worden geladen.")
  if (!data?.gezin_id) throw new Error("Je bent nog niet aan een gezin gekoppeld.")
  return data.gezin_id as string
})

export async function getActiefGezinClient() {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  return { supabase, gezinId }
}
