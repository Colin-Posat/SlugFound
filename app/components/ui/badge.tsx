export type BadgeVariant = 'lost' | 'found' | 'active' | 'claimed' | 'resolved' | 'match-high' | 'match-medium' | 'match-low'

// Filing-label badges: small, mono, uppercase, letter-spaced — like a tag on a
// lost-and-found ticket. Soft tinted fills keyed to the bulletin palette.
const STYLES: Record<BadgeVariant, string> = {
  lost: 'border-lost/25 bg-lost-soft text-lost',
  found: 'border-found/25 bg-found-soft text-found',
  active: 'border-line-strong bg-surface-2 text-ink-soft',
  claimed: 'border-claimed/25 bg-claimed-soft text-claimed',
  resolved: 'border-gold/40 bg-gold-soft text-resolved',
  'match-high': 'border-found/30 bg-found-soft text-found',
  'match-medium': 'border-gold/40 bg-gold-soft text-resolved',
  'match-low': 'border-line-strong bg-surface-2 text-muted',
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
