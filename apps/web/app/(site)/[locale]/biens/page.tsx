import { getDictionary, isLocale } from '@nizios/i18n';
import { PageShell } from '@nizios/ui';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PropertyCard } from '../../../../components/property-card';
import { SearchForm } from '../../../../components/search-form';
import { SiteHeader } from '../../../../components/site-header';
import { fetchProperties, languageAlternates } from '../../../../lib/catalog';
import { fetchTenantByHost } from '../../../../lib/tenant';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const host = headers().get('x-tenant-host') || headers().get('host') || '';
  const tenant = await fetchTenantByHost(host);
  const dictionary = getDictionary(params.locale);
  return {
    title: tenant ? `${dictionary.allListings} | ${tenant.name}` : dictionary.allListings,
    alternates: languageAlternates('/biens'),
  };
}

export default async function ListingsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { quartier?: string; type?: string; budget?: string };
}) {
  const locale = params.locale;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const host = headers().get('x-tenant-host') || headers().get('host') || '';
  const tenant = await fetchTenantByHost(host);
  if (!tenant) notFound();
  const color = tenant.branding?.primaryColor ?? '#14532d';
  const properties = await fetchProperties(host, searchParams);

  return (
    <PageShell wide>
        <SiteHeader locale={locale} dictionary={dictionary} name={tenant.name} color={color} />
      <h1 className="mb-6 text-3xl font-semibold">{dictionary.allListings}</h1>
      <div className="mb-8">
        <SearchForm
          locale={locale}
          dictionary={dictionary}
          districts={tenant.districts ?? []}
          values={searchParams}
        />
      </div>
      {properties.length === 0 ? (
        <p className="text-stone-600">{dictionary.noListings}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
              <PropertyCard key={property.reference} locale={locale} dictionary={dictionary} property={property} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
