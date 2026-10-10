import Link from "next/link"
import { ChevronLeft, UsersRound } from "lucide-react"
import { GezinKaart } from "@/components/gezin-kaart"
import { laadGezinsgegevens } from "@/app/actions/gezinnen"
import { Button } from "@/components/ui/button"

export default async function GezinInstellingenPage() {
  const gezinsgegevens = await laadGezinsgegevens()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-lg" className="size-12" render={<Link href="/instellingen" />} nativeButton={false} aria-label="Terug naar instellingen">
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-primary" aria-hidden />
          <h1 className="font-heading text-xl font-semibold text-foreground">Gezin</h1>
        </div>
      </div>
      <GezinKaart gezinsgegevens={gezinsgegevens} />
    </div>
  )
}
