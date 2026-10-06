import { propertyWhatsappText, waMeUrl } from '@nizios/chatbot-flows';

type Photo = { id?: string; url: string; alt: string | null; sortOrder: number };

export type PropertyRecord = {
  id: string;
  reference: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  priceMad: number | null;
  neighborhood: string | null;
  transaction: 'BUY' | 'RENT' | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceM2: number | null;
  featured: boolean;
  latitude: number | null;
  longitude: number | null;
  photos?: Photo[];
};

export function toAdminProperty(property: PropertyRecord) {
  return {
    id: property.id,
    reference: property.reference,
    title: property.title,
    titleAr: property.titleAr,
    description: property.description,
    descriptionAr: property.descriptionAr,
    status: property.status,
    priceMad: property.priceMad,
    neighborhood: property.neighborhood,
    transaction: property.transaction,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    surfaceM2: property.surfaceM2,
    featured: property.featured,
    latitude: property.latitude,
    longitude: property.longitude,
    photos: (property.photos ?? []).map((photo) => ({
      id: photo.id,
      url: photo.url,
      alt: photo.alt,
      sortOrder: photo.sortOrder,
    })),
  };
}

/** Fiche publique. Le numéro brut de l'agence n'est pas renvoyé, seulement le lien wa.me. */
export function toPublicProperty(property: PropertyRecord, agencyPhone: string | null, locale: 'fr' | 'ar' = 'fr') {
  const title = locale === 'ar' && property.titleAr ? property.titleAr : property.title;
  const text = propertyWhatsappText(property.reference, title, locale);
  const admin = toAdminProperty(property);
  return {
    reference: admin.reference,
    title: admin.title,
    titleAr: admin.titleAr,
    description: admin.description,
    descriptionAr: admin.descriptionAr,
    priceMad: admin.priceMad,
    neighborhood: admin.neighborhood,
    transaction: admin.transaction,
    bedrooms: admin.bedrooms,
    bathrooms: admin.bathrooms,
    surfaceM2: admin.surfaceM2,
    featured: admin.featured,
    latitude: admin.latitude,
    longitude: admin.longitude,
    photos: admin.photos.map((photo) => ({ url: photo.url, alt: photo.alt, sortOrder: photo.sortOrder })),
    whatsappUrl: agencyPhone ? waMeUrl(agencyPhone, text) : null,
  };
}
