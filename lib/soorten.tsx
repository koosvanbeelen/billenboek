import {
  Milk,
  Baby,
  Thermometer,
  Wind,
  Pill,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { Soort } from "@/lib/types"

export const soortMeta: Record<
  Soort,
  { label: string; icon: LucideIcon; kleur: string }
> = {
  voeding: { label: "Voeding", icon: Milk, kleur: "text-sky-600 bg-sky-500/10" },
  luier: { label: "Luier", icon: Baby, kleur: "text-amber-600 bg-amber-500/10" },
  temperatuur: {
    label: "Temperatuur",
    icon: Thermometer,
    kleur: "text-rose-600 bg-rose-500/10",
  },
  boertje: { label: "Boertje", icon: Wind, kleur: "text-teal-600 bg-teal-500/10" },
  vitamine: {
    label: "Vitamine",
    icon: Sparkles,
    kleur: "text-primary bg-primary/10",
  },
  medicatie: {
    label: "Medicatie",
    icon: Pill,
    kleur: "text-indigo-600 bg-indigo-500/10",
  },
}
