import { WachtwoordVergetenWeergave } from "@/components/wachtwoord-vergeten-weergave"

export const dynamic = "force-dynamic"

export default function WachtwoordVergetenPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <WachtwoordVergetenWeergave />
    </main>
  )
}
