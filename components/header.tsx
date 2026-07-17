import Image from "next/image"
import { KindKiezer } from "@/components/kind-kiezer"

// Blijft boven iedere pagina staan (onderdeel van app/(app)/layout.tsx).
// Links de kind-kiezer, rechts het Billenboek-beeldmerk. De afbeelding heeft
// een witte achtergrond, vandaar het eigen witte kaartje eromheen — zo blijft
// het logo ook in donkere modus goed leesbaar.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 pt-safe backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8 xl:px-12">
        <KindKiezer />
        <div className="shrink-0 rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/5">
          <Image
            src="/header.png"
            alt="Billenboek"
            width={1249}
            height={435}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </div>
      </div>
    </header>
  )
}
