import type { Dictionary, Locale } from '@nizios/i18n';
import Image from 'next/image';
import { formatPrice, localizedTitle, type PublicProperty } from '../lib/catalog';

export function PropertyCard({
  locale,
  dictionary,
  property,
}: {
  locale: Locale;
  dictionary: Dictionary;
  property: PublicProperty;
}) {
  const photo = property.photos[0];
  const title = localizedTitle(property, locale);
  const price = formatPrice(
    property.priceMad,
    dictionary.perMonth,
    dictionary.priceOnRequest,
    property.transaction === 'RENT',
  );
  return (
    <a href={`/${locale}/biens/${property.reference}`} className="block overflow-hidden rounded-lg border border-stone-200">
      {photo ? (
        <Image src={photo.url} alt={photo.alt || title} width={1200} height={800} className="h-44 w-full object-cover" />
      ) : (
        <div className="h-44 bg-stone-100" />
      )}
      <div className="p-4">
        <p className="text-xs text-stone-500">
          {dictionary.reference} {property.reference}
          {property.neighborhood ? ` · ${property.neighborhood}` : ''}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-stone-700">{price}</p>
      </div>
    </a>
  );
}
