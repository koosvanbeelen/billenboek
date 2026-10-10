import Link from "next/link"
import { ChevronLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { laadAppInfo } from "@/app/actions/app-info"
import { AppInfoWeergave } from "@/components/app-info-weergave"
import packageJson from "@/package.json"

export default async function AppInfoPage() {
  const info = await laadAppInfo(packageJson.version)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-12"
          render={<Link href="/instellingen" />}
          nativeButton={false}
          aria-label="Terug naar instellingen"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <div className="flex items-center gap-2">
          <Info className="size-5 text-primary" aria-hidden />
          <h1 className="font-heading text-xl font-semibold text-foreground">App-info</h1>
        </div>
      </div>
      <AppInfoWeergave info={info} />
    </div>
  )
}
