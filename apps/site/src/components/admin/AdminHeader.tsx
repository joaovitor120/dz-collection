import Link from 'next/link';
import { signOut } from '@/app/admin/login/actions';

const links = [
  { href: '/admin', label: 'Painel' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/configuracoes/seguranca', label: 'Segurança' },
];

export function AdminHeader({ email, current }: { email: string; current: string }) {
  return (
    <header className="border-b border-line bg-paper-pure">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <Link href="/admin" className="font-display text-lg leading-none">
          DZ Collection
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map((link) => {
            const active =
              link.href === '/admin' ? current === '/admin' : current.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`text-2xs uppercase tracking-widest2 transition-colors ${
                  active ? 'text-ink underline underline-offset-4' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-4">
          <span className="hidden truncate text-xs text-ink-muted sm:block">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-[40px] shrink-0 border border-line-strong px-3 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
