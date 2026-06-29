import { getDagGegevens } from "@/app/actions/registraties"
import { VandaagWeergave } from "@/components/vandaag-weergave"
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
  const data = await getDagGegevens(dag)

  return <VandaagWeergave data={data} />
}
