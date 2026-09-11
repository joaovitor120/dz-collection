import Link from 'next/link';
import { AuthShell } from '@/components/admin/AuthShell';
import { ResetRequestForm } from '@/components/admin/ResetRequestForm';

export const metadata = { title: 'Recuperar senha' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos as instruções."
      footer={<Link href="/admin/login" className="link-underline">Voltar para o login</Link>}
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
