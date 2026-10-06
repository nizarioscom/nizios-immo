import { PageShell } from '@nizios/ui';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogoutButton } from '../../../components/logout-button';

export const dynamic = 'force-dynamic';

type Me = {
  name: string;
  email: string;
  role: string;
  tenant: { name: string; slug: string } | null;
};

export default async function AdminHomePage() {
  const token = cookies().get('nizios_admin_token')?.value;
  if (!token) redirect('/admin/login');

  const base =
    process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${base}/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) redirect('/admin/login');
  const me = (await response.json()) as Me;

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">Bonjour {me.name}</h1>
      <p className="mt-3 text-stone-600">{me.email}</p>
      <p className="mt-1 text-stone-600">
        Rôle : {me.role === 'SUPER_ADMIN' ? 'super-admin Nizios' : 'admin agence'}
      </p>
      <p className="mt-1 text-stone-600">
        Tenant : {me.tenant ? `${me.tenant.name} (${me.tenant.slug})` : 'aucun — compte Nizios'}
      </p>
      <nav className="mt-8 flex gap-4 text-sm">
        <a className="underline" href="/admin/biens">
          Biens
        </a>
        <a className="underline" href="/admin/leads">
          Leads
        </a>
      </nav>
      <div className="mt-8">
        <LogoutButton />
      </div>
    </PageShell>
  );
}
