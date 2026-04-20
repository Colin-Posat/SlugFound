export type BadgeVariant = 'lost' | 'found' | 'active' | 'resolved'

const STYLES: Record<BadgeVariant, string> = {
  lost: 'border-red-500/20 bg-red-500/10 text-red-400',
  found: 'border-green-500/20 bg-green-500/10 text-green-400',
  active: 'border-zinc-700 bg-zinc-800/50 text-zinc-400',
  resolved: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-400',
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
