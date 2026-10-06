import { PageShell } from '@nizios/ui';
import Link from 'next/link';
import { adminFetch, type AdminLead } from '../../../../lib/admin-api';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const response = await adminFetch('/leads');
  const leads = response.ok ? ((await response.json()) as AdminLead[]) : [];
  return (
    <PageShell wide>
      <p className="text-sm">
        <Link href="/admin" className="underline">
          Espace agence
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold">Leads</h1>
      {!response.ok ? <p className="mt-6 text-stone-600">Compte agence requis.</p> : null}
      <ul className="mt-8 divide-y divide-stone-200 text-sm">
        {leads.map((lead) => (
          <li key={lead.id} className="py-3">
            <p className="font-medium">
              {lead.name} — {lead.phone}
            </p>
            <p className="text-stone-600">
              {lead.source} · {lead.intent ?? '—'} · {lead.neighborhood ?? '—'} · {lead.budgetLabel ?? '—'} · {lead.timeline ?? '—'} · {lead.status}
            </p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
