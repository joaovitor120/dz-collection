import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from './Icon';

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'Ver tudo',
  align = 'left',
  as: Tag = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
}) {
  const centered = align === 'center';
  return (
    <div
      className={`mb-7 flex flex-col gap-3 md:mb-9 md:flex-row md:items-end ${
        centered ? 'items-center text-center' : 'md:justify-between'
      }`}
    >
      <div className={centered ? 'mx-auto max-w-prose2' : 'max-w-prose2'}>
        {eyebrow ? <p className="eyebrow mb-2.5">{eyebrow}</p> : null}
        <Tag className="font-display text-[1.65rem] leading-[1.15] tracking-[-0.01em] md:text-[2.1rem]">
          {title}
        </Tag>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="link-underline group inline-flex shrink-0 items-center gap-2 self-start text-2xs uppercase tracking-widest2 text-ink md:self-auto"
        >
          {linkLabel}
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-250 ease-editorial group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}
