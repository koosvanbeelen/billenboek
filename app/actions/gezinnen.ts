"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiefGezinId } from "@/lib/supabase/gezin"
import { gebruikersIdSchema, gezinsnaamSchema, eersteFout, type Uitkomst } from "@/lib/account-validatie"
import { logFout } from "@/lib/fouten"

// Foutcodes uit de database-functies (RAISE EXCEPTION) naar tekst voor de gebruiker.
const RPC_FOUTEN: Record<string, string> = {
  already_in_family: "Je bent al aan een gezin gekoppeld.",
  family_name_too_short: "Kies een gezinsnaam van minimaal twee tekens.",
  family_name_too_long: "Gebruik maximaal 60 tekens voor de gezinsnaam.",
  not_authenticated: "Je sessie is verlopen. Log opnieuw in.",
  not_in_family: "Je bent nog niet aan een gezin gekoppeld.",
  not_owner: "Alleen de eigenaar van het gezin kan dit doen.",
  cannot_remove_self: "Je kunt jezelf niet verwijderen. Gebruik daarvoor Account verwijderen.",
  not_a_member: "Dit gezinslid hoort niet (meer) bij het gezin.",
}

function rpcFout(context: string, error: { message: string }, standaard: string): { ok: false; fout: string } {
  logFout(context, error.message)
  return { ok: false, fout: RPC_FOUTEN[error.message] ?? standaard }
}

type Uitnodiging = { code: string; vervaltOp: string }

export async function maakGezinAan(naam: string): Promise<Uitkomst<Uitnodiging>> {
  const parsed = gezinsnaamSchema.safeParse(naam)
  if (!parsed.success) return { ok: false, fout: eersteFout(parsed.error) }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_family_with_invite", { family_name: parsed.data })
  if (error) return rpcFout("gezinnen.maakGezinAan", error, "We konden je gezin niet aanmaken. Probeer het opnieuw.")

  revalidatePath("/", "layout")
  const r = data as { code: string; vervalt_op: string }
  return { ok: true, code: r.code, vervaltOp: r.vervalt_op }
}

type DeelnameAntwoord = { ok: boolean; fout?: string; wachttijd_seconden?: number; pogingen_over?: number }

export async function neemDeelMetCode(value: string): Promise<Uitkomst> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_family_with_code", { invite_code: String(value ?? "") })
  if (error) return rpcFout("gezinnen.neemDeelMetCode", error, "We konden je niet aan het gezin koppelen. Probeer het opnieuw.")

  const antwoord = data as DeelnameAntwoord
  if (!antwoord.ok) {
    if (antwoord.fout === "too_many_attempts" || antwoord.pogingen_over === 0) {
      const minuten = Math.max(1, Math.ceil((antwoord.wachttijd_seconden ?? 900) / 60))
      return {
        ok: false,
        fout: `Te veel mislukte pogingen. Probeer het over ${minuten} ${minuten === 1 ? "minuut" : "minuten"} opnieuw.`,
      }
    }
    const over = antwoord.pogingen_over
    return {
      ok: false,
      fout:
        over === undefined
          ? "Deze uitnodigingscode is ongeldig of verlopen."
          : `Deze uitnodigingscode is ongeldig of verlopen. Je hebt nog ${over} ${over === 1 ? "poging" : "pogingen"}.`,
    }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

// Een nieuwe code maakt de vorige actieve code ongeldig (één actieve code per gezin).
export async function maakNieuweUitnodiging(): Promise<Uitkomst<Uitnodiging>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("maak_uitnodiging")
  if (error) return rpcFout("gezinnen.maakNieuweUitnodiging", error, "Nieuwe code aanmaken lukt niet.")
  revalidatePath("/instellingen")
  const r = data as { code: string; vervalt_op: string }
  return { ok: true, code: r.code, vervaltOp: r.vervalt_op }
}

export async function trekUitnodigingIn(): Promise<Uitkomst> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("trek_uitnodiging_in")
  if (error) return rpcFout("gezinnen.trekUitnodigingIn", error, "De code kon niet worden ingetrokken.")
  revalidatePath("/instellingen")
  return { ok: true }
}

export async function verwijderGezinslid(userId: string): Promise<Uitkomst> {
  const parsed = gebruikersIdSchema.safeParse(userId)
  if (!parsed.success) return { ok: false, fout: "Onbekend gezinslid." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("verwijder_gezinslid", { doel_gebruiker: parsed.data })
  if (error) return rpcFout("gezinnen.verwijderGezinslid", error, "Het gezinslid kon niet worden verwijderd.")
  revalidatePath("/instellingen")
  return { ok: true }
}

export type GezinsLid = { user_id: string; rol: string; naam: string | null; ben_ik: boolean }
export type Gezinsgegevens = {
  gezin: { id: string; naam: string } | null
  leden: GezinsLid[]
  ikBenEigenaar: boolean
  actieveCode: { code: string; vervalt_op: string } | null
}

export async function laadGezinsgegevens(): Promise<Gezinsgegevens> {
  const supabase = await createClient()
  const gezinId = await getActiefGezinId()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: gezin }, { data: leden }, { data: uitnodigingen }] = await Promise.all([
    supabase.from("gezinnen").select("id, naam").eq("id", gezinId).single(),
    supabase.from("gezin_leden").select("user_id, rol, aangemaakt_op").eq("gezin_id", gezinId).order("aangemaakt_op"),
    supabase.from("gezin_uitnodigingen").select("code, vervalt_op").eq("gezin_id", gezinId).order("aangemaakt_op", { ascending: false }).limit(10),
  ])

  const ledenLijst = leden ?? []
  const { data: profielen } = ledenLijst.length
    ? await supabase.from("profielen").select("user_id, weergavenaam").in("user_id", ledenLijst.map((lid) => lid.user_id))
    : { data: [] as { user_id: string; weergavenaam: string }[] }
  const namen = new Map((profielen ?? []).map((p) => [p.user_id, p.weergavenaam.trim()]))

  const nu = Date.now()
  const actief = (uitnodigingen ?? []).find((u) => new Date(u.vervalt_op).getTime() > nu)

  return {
    gezin: gezin ? { id: gezin.id as string, naam: gezin.naam as string } : null,
    leden: ledenLijst.map((lid) => ({
      user_id: lid.user_id as string,
      rol: lid.rol as string,
      naam: namen.get(lid.user_id) || null,
      ben_ik: lid.user_id === user?.id,
    })),
    ikBenEigenaar: ledenLijst.some((lid) => lid.user_id === user?.id && lid.rol === "eigenaar"),
    actieveCode: actief ? { code: actief.code as string, vervalt_op: actief.vervalt_op as string } : null,
  }
}
