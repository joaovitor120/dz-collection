import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false as const,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9.5 6 5.5 6-5.5" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 6 5.5 6-5.5 6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 19 6v5.4c0 4.2-2.8 7.6-7 9.1-4.2-1.5-7-4.9-7-9.1V6l7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

export function PixIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.6 20.4 12 12 20.4 3.6 12 12 3.6Z" />
      <path d="M8.4 8.4 12 12l3.6-3.6M8.4 15.6 12 12l3.6 3.6" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12.2c0 3.8-3.6 6.8-8 6.8-1 0-2-.15-2.9-.43L4.5 20l1.1-3.2A6.6 6.6 0 0 1 4 12.2C4 8.4 7.6 5.4 12 5.4s8 3 8 6.8Z" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c.9 4.2 2.4 5.7 6.5 6.5-4.1.8-5.6 2.3-6.5 6.5-.9-4.2-2.4-5.7-6.5-6.5 4.1-.8 5.6-2.3 6.5-6.5Z" />
      <path d="M18 16.5c.4 1.8 1 2.4 2.8 2.8-1.8.4-2.4 1-2.8 2.8-.4-1.8-1-2.4-2.8-2.8 1.8-.4 2.4-1 2.8-2.8Z" />
    </svg>
  );
}

export function ZoomIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M11 8.5v5M8.5 11h5M16 16l4.5 4.5" />
    </svg>
  );
}

/** Ícone do WhatsApp (glifo oficial, sólido). Cor definida por quem usa. */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.86 1.22 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2.5c-5.24 0-9.5 4.26-9.5 9.5 0 1.67.44 3.3 1.27 4.74L2.5 21.5l4.9-1.28a9.46 9.46 0 0 0 4.64 1.2h.01c5.24 0 9.5-4.26 9.5-9.5s-4.27-9.42-9.51-9.42Zm0 17.38h-.01a7.9 7.9 0 0 1-4.02-1.1l-.29-.17-2.98.78.8-2.9-.19-.3a7.86 7.86 0 0 1-1.21-4.19c0-4.35 3.55-7.9 7.9-7.9 2.11 0 4.09.82 5.58 2.31a7.84 7.84 0 0 1 2.31 5.59c0 4.36-3.54 7.88-7.89 7.88Z" />
    </svg>
  );
}
