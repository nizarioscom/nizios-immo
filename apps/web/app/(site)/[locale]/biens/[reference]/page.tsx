import { getDictionary, isLocale } from '@nizios/i18n';
import { PageShell } from '@nizios/ui';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { LeadForm } from '../../../../../components/lead-form';
import { SiteHeader } from '../../../../../components/site-header';
import {
  fetchProperty,
  formatPrice,
  languageAlternates,
  localizedDescription,
  localizedTitle,
} from '../../../../../lib/catalog';
import { fetchTenantByHost } from '../../../../../lib/tenant';

export const dynamic = 'force-dynamic';

async function load(locale: string, reference: string) {
  const host = headers().get('x-tenant-host') || headers().get('host') || '';
  const tenant = await fetchTenantByHost(host);
  if (!tenant || !isLocale(locale)) return { host, tenant: null, property: null };
  const property = await fetchProperty(host, reference, locale);
  return { host, tenant, property };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; reference: string };
}): Promise<Metadata> {
  const { tenant, property } = await load(params.locale, params.reference);
  if (!tenant || !property || !isLocale(params.locale)) return {};
  const title = localizedTitle(property, params.locale);
  return {
    title: `${title} | ${tenant.name}`,
    description: localizedDescription(property, params.locale),
    alternates: languageAlternates(`/biens/${property.reference}`),
  };
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: { locale: string; reference: string };
  searchParams: { envoye?: string; erreur?: string };
}) {
  const locale = params.locale;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const { tenant, property } = await load(params.locale, params.reference);
  if (!tenant || !property) notFound();
  const color = tenant.branding?.primaryColor ?? '#14532d';
  const title = localizedTitle(property, locale);
  const description = localizedDescription(property, locale);
  const price = formatPrice(
    property.priceMad,
    dictionary.perMonth,
    dictionary.priceOnRequest,
    property.transaction === 'RENT',
  );
  const pageUrl = `/${locale}/biens/${property.reference}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description,
    url: pageUrl,
    image: property.photos.map((photo) => photo.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.neighborhood ?? 'Rabat',
      addressCountry: 'MA',
    },
    offers: property.priceMad
      ? { '@type': 'Offer', price: property.priceMad, priceCurrency: 'MAD' }
      : undefined,
  };

  return (
    <PageShell wide>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader locale={locale} dictionary={dictionary} name={tenant.name} color={color} />
      <p className="text-sm text-stone-500">
        {dictionary.reference} {property.reference}
        {property.neighborhood ? ` · ${property.neighborhood}` : ''}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      {searchParams.envoye === '1' ? (
        <p data-lead-sent="1" className="mt-4 max-w-md rounded-md bg-emerald-50 px-4 py-3 text-emerald-900">
          {dictionary.sent}
        </p>
      ) : null}
      <p className="mt-3 text-lg">{price}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {property.photos.map((photo, index) => (
          <Image
            key={photo.url}
            src={photo.url}
            alt={photo.alt || title}
            width={1200}
            height={800}
            priority={index === 0}
            className="h-auto w-full rounded-md bg-stone-100"
          />
        ))}
      </div>
      <ul className="mt-6 flex flex-wrap gap-4 text-sm text-stone-700">
        {property.bedrooms != null ? (
          <li>
            {property.bedrooms} {dictionary.bedrooms}
          </li>
        ) : null}
        {property.bathrooms != null ? (
          <li>
            {property.bathrooms} {dictionary.bathrooms}
          </li>
        ) : null}
        {property.surfaceM2 != null ? (
          <li>
            {property.surfaceM2} {dictionary.surface}
          </li>
        ) : null}
      </ul>
      {description ? <p className="mt-4 max-w-2xl leading-relaxed text-stone-700">{description}</p> : null}
      {property.latitude != null && property.longitude != null ? (
        <p className="mt-4">
          {/* Lien seulement : pas de tuile ni de script Google, pour garder la page légère. */}
          <a
            className="underline"
            href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dictionary.map}
          </a>
        </p>
      ) : null}
      {property.whatsappUrl ? (
        <p className="mt-6">
          <a
            data-whatsapp="1"
            className="inline-flex rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: color }}
            href={property.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dictionary.whatsapp}
          </a>
        </p>
      ) : null}
      {searchParams.envoye === '1' ? null : (
      <section className="mt-10 max-w-md">
        <h2 className="mb-4 text-xl font-semibold">{dictionary.leadTitle}</h2>
        <LeadForm
          locale={locale}
          dictionary={dictionary}
          districts={tenant.districts ?? []}
          defaults={{
            intent: property.transaction ?? undefined,
            neighborhood: property.neighborhood ?? undefined,
            reference: property.reference,
          }}
          sent={false}
          failed={searchParams.erreur === '1'}
        />
      </section>
      )}
    </PageShell>
  );
}
