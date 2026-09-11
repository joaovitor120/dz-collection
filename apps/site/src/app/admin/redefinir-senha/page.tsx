import { AuthShell } from '@/components/admin/AuthShell';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';

export const metadata = { title: 'Redefinir senha' };
export const dynamic = 'force-dynamic';

/**
 * Chega-se aqui pelo link de recuperação, já com sessão criada pelo callback.
 * A troca em si usa a mesma action da tela de segurança.
 */
export default function Page() {
  return (
    <AuthShell title="Definir nova senha" subtitle="Escolha uma senha longa e exclusiva.">
      <PasswordChangeForm />
    </AuthShell>
  );
}
