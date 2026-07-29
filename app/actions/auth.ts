"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/server"

export async function uitloggen() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/login")
}
