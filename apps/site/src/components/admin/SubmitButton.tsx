'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xs border border-ink bg-ink px-5 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? 'Aguarde…' : children}
    </button>
  );
}
