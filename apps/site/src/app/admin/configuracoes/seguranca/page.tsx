import { requireAdminPage } from '@/lib/admin/auth';
import { MfaSetup } from '@/components/admin/MfaSetup';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';

export const metadata = { title: 'Segurança' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  // requireMfa: false — esta é justamente a tela onde o MFA é configurado pela
  // primeira vez. Todas as demais rotas do painel exigem aal2.
  const { client, user } = await requireAdminPage({ requireMfa: false });
  const { data: factors } = await client.auth.mfa.listFactors();
  const verified = factors?.totp?.find((f) => f.status === 'verified') ?? null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="eyebrow">Configurações</p>
      <h1 className="mt-3 font-display text-3xl">Segurança</h1>
      <p className="mt-2 text-sm text-ink-muted">{user.email}</p>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl">Verificação em duas etapas</h2>
        <p className="mb-6 mt-2 max-w-prose2 text-sm text-ink-muted">
          Esta conta controla todo o catálogo. Senha sozinha não basta.
        </p>
        <MfaSetup enrolled={verified ? { id: verified.id } : null} />
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl">Alterar senha</h2>
        <p className="mb-6 mt-2 max-w-prose2 text-sm text-ink-muted">
          Ao alterar, todas as outras sessões são encerradas.
        </p>
        <PasswordChangeForm />
      </section>
    </div>
  );
}
