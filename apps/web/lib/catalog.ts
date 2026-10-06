import type { Locale } from '@nizios/i18n';

export type PublicProperty = {
  reference: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  priceMad: number | null;
  neighborhood: string | null;
  transaction: 'BUY' | 'RENT' | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceM2: number | null;
  featured: boolean;
  latitude: number | null;
  longitude: number | null;
  photos: { url: string; alt: string | null; sortOrder: number }[];
  whatsappUrl: string | null;
};

function apiBase() {
  return process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export async function fetchProperties(
  host: string,
  query: { quartier?: string; type?: string; budget?: string; featured?: string },
): Promise<PublicProperty[]> {
  const url = new URL(`${apiBase()}/public/properties`);
  url.searchParams.set('host', host);
  if (query.quartier) url.searchParams.set('quartier', query.quartier);
  if (query.type) url.searchParams.set('type', query.type);
  if (query.budget) url.searchParams.set('budget', query.budget);
  if (query.featured) url.searchParams.set('featured', query.featured);
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    return (await response.json()) as PublicProperty[];
  } catch {
    return [];
  }
}

export async function fetchProperty(host: string, reference: string, locale: Locale): Promise<PublicProperty | null> {
  const url = new URL(`${apiBase()}/public/properties/${encodeURIComponent(reference)}`);
  url.searchParams.set('host', host);
  url.searchParams.set('locale', locale);
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as PublicProperty;
  } catch {
    return null;
  }
}

export function localizedTitle(property: PublicProperty, locale: Locale): string {
  if (locale === 'ar' && property.titleAr) return property.titleAr;
  return property.title;
}

export function localizedDescription(property: PublicProperty, locale: Locale): string {
  if (locale === 'ar' && property.descriptionAr) return property.descriptionAr;
  return property.description ?? '';
}

export function formatPrice(value: number | null, perMonth: string, onRequest: string, rent: boolean): string {
  if (value === null || value === undefined) return onRequest;
  const amount = new Intl.NumberFormat('fr-FR').format(value);
  return rent ? `${amount} ${perMonth}` : `${amount} MAD`;
}

export function languageAlternates(path: string) {
  const suffix = path === '/' ? '' : path;
  return {
    languages: {
      fr: `/fr${suffix}`,
      ar: `/ar${suffix}`,
      'x-default': `/fr${suffix}`,
    },
  };
}
