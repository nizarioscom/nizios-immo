import { PageShell } from '@nizios/ui';
import { LoginForm } from '../../../../components/login-form';

export default function LoginPage() {
  return (
    <PageShell>
      <p className="text-sm text-stone-500">Nizios</p>
      <h1 className="mt-2 text-3xl font-semibold">Espace agence</h1>
      <p className="mt-2 text-stone-600">Connexion de l&apos;administrateur du tenant.</p>
      <LoginForm />
    </PageShell>
  );
}
