import { AuthShell } from '@/components/admin/AuthShell';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata = { title: 'Entrar' };
/** Rota de autenticação nunca é pré-renderizada nem cacheada. */
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <AuthShell title="Painel Administrativo">
      <LoginForm />
    </AuthShell>
  );
}
