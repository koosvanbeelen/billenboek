import { getDagGegevens } from "@/app/actions/registraties"
import { getNotities } from "@/app/actions/notities"
import { VandaagWeergave } from "@/components/vandaag-weergave"
import { NotitiesWeergave } from "@/components/notities-weergave"
import { vandaagDatum } from "@/lib/datum"

export const dynamic = "force-dynamic"

export default async function VandaagPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string }>
}) {
  const { datum } = await searchParams
  const geldig = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum)
  const dag = geldig ? datum : vandaagDatum()
  const [data, notities] = await Promise.all([
    getDagGegevens(dag),
    getNotities(),
  ])

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-6 xl:gap-10">
      <VandaagWeergave data={data} />
      {/* Notities-paneel: alleen zichtbaar op laptop/desktop (lg+), naast
          Vandaag. Op telefoon/tablet blijft Notities een eigen tab. */}
      <aside className="hidden lg:sticky lg:top-10 lg:block">
        <NotitiesWeergave notities={notities} />
      </aside>
    </div>
  )
}

