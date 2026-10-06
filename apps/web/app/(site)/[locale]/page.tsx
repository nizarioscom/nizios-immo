import { getDictionary, isLocale } from '@nizios/i18n';
import { PageShell } from '@nizios/ui';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchTenantByHost } from '../../../lib/tenant';

export const dynamic = 'force-dynamic';

async function tenantForRequest() {
  const host = headers().get('x-tenant-host') || headers().get('host') || '';
  return fetchTenantByHost(host);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return { title: 'Nizios' };
  const tenant = await tenantForRequest();
  return { title: tenant?.name ?? 'Agence' };
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dictionary = getDictionary(params.locale);
  const tenant = await tenantForRequest();

  if (!tenant) {
    return (
      <PageShell>
        <h1 className="text-3xl font-semibold">{dictionary.notFoundTitle}</h1>
        <p className="mt-3 text-stone-600">{dictionary.notFoundBody}</p>
      </PageShell>
    );
  }

  const copy = tenant.content[params.locale] ?? {};
  const color = tenant.branding?.primaryColor ?? '#14532d';

  return (
    <PageShell>
      <header className="mb-10 flex items-center justify-between gap-4">
        <p className="text-sm text-stone-500">{dictionary.preparing}</p>
        <a className="text-sm underline" href={`/${dictionary.otherLocale}`}>
          {dictionary.otherLanguage}
        </a>
      </header>
      <div className="mb-6 h-1 w-16" style={{ backgroundColor: color }} />
      <h1 data-tenant={tenant.slug} className="text-4xl font-semibold tracking-tight">
        {tenant.name}
      </h1>
      {copy.tagline ? <p className="mt-4 text-lg text-stone-700">{copy.tagline}</p> : null}
      {copy.intro ? (
        <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600">{copy.intro}</p>
      ) : null}
    </PageShell>
  );
}
