import type { ReactNode } from 'react';

/** Moldura das telas de autenticação. */
export function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="inline-flex flex-col items-center leading-none">
            <span className="font-display text-3xl font-medium tracking-[0.06em]">DZ</span>
            <span className="mt-1.5 flex w-full items-center gap-2 text-[0.55rem]">
              <span className="h-px flex-1 bg-gold/50" />
              <span className="font-sans uppercase tracking-widest2">Collection</span>
              <span className="h-px flex-1 bg-gold/50" />
            </span>
          </span>
          <h1 className="mt-7 font-display text-2xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ink-muted">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-xs text-ink-muted">{footer}</div> : null}
      </div>
    </main>
  );
}

export function Field({
  label, name, type = 'text', autoComplete, required = true, inputMode, pattern, maxLength, autoFocus,
}: {
  label: string; name: string; type?: string; autoComplete?: string; required?: boolean;
  inputMode?: 'text' | 'numeric'; pattern?: string; maxLength?: number; autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      <input
        name={name} type={type} required={required} autoComplete={autoComplete}
        inputMode={inputMode} pattern={pattern} maxLength={maxLength} autoFocus={autoFocus}
        className="min-h-[46px] w-full border border-line-strong bg-transparent px-3 text-sm outline-none transition-colors focus:border-ink"
      />
    </label>
  );
}

export function Alert({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className={`mb-5 border px-3 py-2.5 text-xs leading-relaxed ${
      tone === 'error' ? 'border-red-300 bg-red-50 text-red-900' : 'border-line bg-paper-shade text-ink-soft'
    }`}>
      {children}
    </p>
  );
}
