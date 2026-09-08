import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink-soft border border-ink hover:border-ink-soft',
  outline:
    'bg-transparent text-ink border border-line-strong hover:border-ink hover:bg-ink hover:text-paper',
  ghost: 'bg-transparent text-ink border border-transparent hover:text-gold-deep',
  gold: 'bg-gold text-paper border border-gold hover:bg-gold-deep hover:border-gold-deep',
};

const sizes: Record<Size, string> = {
  // min-h garante área de toque confortável no mobile
  sm: 'min-h-[40px] px-3.5 text-[0.72rem] gap-1.5',
  md: 'min-h-[46px] px-5 text-[0.78rem] gap-2',
  lg: 'min-h-[54px] px-7 text-[0.82rem] gap-2.5',
};

const shared =
  'inline-flex items-center justify-center font-sans font-medium uppercase tracking-[0.14em] rounded-xs transition-colors duration-250 ease-editorial disabled:opacity-40 disabled:pointer-events-none';

export function buttonClass(
  variant: Variant = 'primary',
  size: Size = 'md',
  className = '',
) {
  return `${shared} ${variants[variant]} ${sizes[size]} ${className}`;
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}
