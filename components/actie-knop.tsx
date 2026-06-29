"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Grote actieknop met icoon en label. Minimaal 48x48 tikvlak.
export function ActieKnop({
  label,
  icon: Icon,
  onClick,
  className,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-colors",
        "hover:bg-accent active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="text-sm font-medium text-card-foreground">{label}</span>
    </button>
  )
}
