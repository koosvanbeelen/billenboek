"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/server"

// Inloggen verloopt volledig client-side via authClient.signIn.magicLink()
// (zie components/login-form.tsx) omdat dat een client-only Neon Auth API
// is. Uitloggen kan wel als server action, zodat de knop in de
// Instellingen-pagina simpel blijft.
export async function uitloggen() {
  await auth.signOut()
  redirect("/login")
}
