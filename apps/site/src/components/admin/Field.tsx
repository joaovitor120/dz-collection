import type { ReactNode } from 'react';

/** Primitivos de formulário. Rótulo sempre associado, sempre visível. */

const inputBase =
  'w-full min-h-[48px] rounded-xs border border-line-strong bg-paper-pure px-3 py-2 text-sm ' +
  'text-ink outline-none transition-colors focus:border-ink';

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="eyebrow text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputBase} min-h-[120px] resize-y leading-relaxed ${props.className ?? ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

/** Checkbox com alvo de toque adequado — 44px é o mínimo utilizável. */
export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      htmlFor={name}
      className="flex min-h-[44px] cursor-pointer items-start gap-3 border border-line bg-paper-pure p-3"
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
      />
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Notice({ state }: { state: { error?: string; info?: string } }) {
  if (!state.error && !state.info) return null;
  const isError = Boolean(state.error);
  return (
    <p
      role="status"
      aria-live="polite"
      className={`border px-3 py-2.5 text-sm ${
        isError
          ? 'border-red-300 bg-red-50 text-red-800'
          : 'border-line-strong bg-paper-shade text-ink'
      }`}
    >
      {state.error ?? state.info}
    </p>
  );
}
