"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/server"

// Inloggen verloopt volledig client-side via authClient.signIn.email() /
// signUp.email() (zie components/login-form.tsx en
// gezin-starten-weergave.tsx). Uitloggen kan wel als server action, zodat de
// knop in de Instellingen-pagina simpel blijft.
export async function uitloggen() {
  await auth.signOut()
  redirect("/login")
}
