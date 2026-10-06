import { getDictionary, isLocale } from '@nizios/i18n';
import { PageShell } from '@nizios/ui';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PropertyCard } from '../../../components/property-card';
import { SearchForm } from '../../../components/search-form';
import { SiteHeader } from '../../../components/site-header';
import { fetchProperties, languageAlternates } from '../../../lib/catalog';
import { fetchTenantByHost } from '../../../lib/tenant';

export const dynamic = 'force-dynamic';

async function tenantForRequest() {
  const host = headers().get('x-tenant-host') || headers().get('host') || '';
  return { host, tenant: await fetchTenantByHost(host) };
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return { title: 'Nizios' };
  const { tenant } = await tenantForRequest();
  const copy = tenant?.content[params.locale];
  return {
    title: tenant?.name ?? 'Agence',
    description: copy?.tagline,
    alternates: languageAlternates('/'),
  };
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const { host, tenant } = await tenantForRequest();
  if (!tenant) {
    return (
      <PageShell>
        <h1 className="text-3xl font-semibold">{dictionary.notFoundTitle}</h1>
        <p className="mt-3 text-stone-600">{dictionary.notFoundBody}</p>
      </PageShell>
    );
  }
  const copy = tenant.content[locale] ?? {};
  const color = tenant.branding?.primaryColor ?? '#14532d';
  const featured = await fetchProperties(host, { featured: '1' });

  return (
    <PageShell wide>
      <SiteHeader locale={locale} dictionary={dictionary} name={tenant.name} color={color} />
      <section className="mb-10">
        <div className="mb-4 h-1 w-16" style={{ backgroundColor: color }} />
        <h1 data-tenant={tenant.slug} className="text-4xl font-semibold tracking-tight">
          {copy.hero ?? tenant.name}
        </h1>
        {copy.tagline ? <p className="mt-4 text-lg text-stone-700">{copy.tagline}</p> : null}
        {copy.intro ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">{copy.intro}</p> : null}
      </section>
      <section className="mb-12 rounded-lg border border-stone-200 p-4">
        <h2 className="mb-4 text-lg font-semibold">{dictionary.searchTitle}</h2>
        <SearchForm locale={locale} dictionary={dictionary} districts={tenant.districts ?? []} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">{dictionary.featured}</h2>
        {featured.length === 0 ? (
          <p className="text-stone-600">{dictionary.noListings}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((property) => (
              <PropertyCard key={property.reference} locale={locale} dictionary={dictionary} property={property} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
