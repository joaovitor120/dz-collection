import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@dz/shared/supabase/server';
import { AuthShell } from '@/components/admin/AuthShell';
import { MfaForm } from '@/components/admin/MfaForm';

export const metadata = { title: 'Verificação em duas etapas' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const store = await cookies();
  const supabase = createClient({
    getAll: () => store.getAll().map(({ name, value }) => ({ name, value })),
    set: (name, value, options) => store.set(name, value, options),
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.find((f) => f.status === 'verified');
  if (!factor) redirect('/admin/configuracoes/seguranca?exigirMfa=1');

  return (
    <AuthShell
      title="Verificação em duas etapas"
      subtitle="Digite o código de 6 dígitos do seu aplicativo autenticador."
    >
      <MfaForm factorId={factor.id} />
    </AuthShell>
  );
}
