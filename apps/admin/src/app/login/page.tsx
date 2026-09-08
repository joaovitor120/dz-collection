import { AuthShell } from '@/components/AuthShell';
import { LoginForm } from '@/components/LoginForm';

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
