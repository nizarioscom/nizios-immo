import { PageShell } from '@nizios/ui';
import Link from 'next/link';
import { adminFetch, type AdminProperty } from '../../../../lib/admin-api';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const response = await adminFetch('/properties');
  const properties = response.ok ? ((await response.json()) as AdminProperty[]) : [];
  return (
    <PageShell wide>
      <p className="text-sm">
        <Link href="/admin" className="underline">
          Espace agence
        </Link>
      </p>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Biens</h1>
        <Link href="/admin/biens/nouveau" className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">
          Nouveau bien
        </Link>
      </div>
      {!response.ok ? (
        <p className="mt-6 text-stone-600">
          Ces données demandent un compte agence. Le super-admin Nizios doit indiquer un tenant.
        </p>
      ) : null}
      <ul className="mt-8 divide-y divide-stone-200">
        {properties.map((property) => (
          <li key={property.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-medium">
                {property.reference} — {property.title}
              </p>
              <p className="text-sm text-stone-600">
                {property.neighborhood ?? '—'} · {property.status === 'PUBLISHED' ? 'Publié' : 'Non publié'}
              </p>
            </div>
            <Link href={`/admin/biens/${property.id}`} className="text-sm underline">
              Modifier
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
