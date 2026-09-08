import type { ReactNode } from 'react';

type Tone = 'ink' | 'gold' | 'muted';

const tones: Record<Tone, string> = {
  ink: 'bg-ink text-paper',
  gold: 'bg-transparent text-gold-deep border border-gold/50',
  muted: 'bg-paper/90 text-ink border border-line',
};

export function Badge({
  children,
  tone = 'ink',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-[0.6rem] uppercase leading-none tracking-widest2 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
