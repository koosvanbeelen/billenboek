import { redirect } from "next/navigation"
import { isIngelogd } from "@/lib/auth"
import { BottomNav } from "@/components/bottom-nav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isIngelogd())) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <main className="flex-1 px-4 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  )
}
