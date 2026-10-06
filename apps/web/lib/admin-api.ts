import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type AdminProperty = {
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
  photos: { id?: string; url: string; alt: string | null; sortOrder: number }[];
};

export type AdminLead = {
  id: string;
  source: string;
  name: string;
  phone: string;
  intent: string | null;
  budgetLabel: string | null;
  neighborhood: string | null;
  timeline: string | null;
  status: string;
  createdAt: string;
};

function base() {
  return process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export async function adminFetch(path: string, init?: RequestInit) {
  const token = cookies().get('nizios_admin_token')?.value;
  if (!token) redirect('/admin/login');
  const response = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
      ...(init?.headers || {}),
      authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (response.status === 401) redirect('/admin/login');
  return response;
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function propertyPayload(form: FormData) {
  return {
    reference: String(form.get('reference') || '').trim(),
    title: String(form.get('title') || '').trim(),
    titleAr: String(form.get('titleAr') || '').trim(),
    description: String(form.get('description') || '').trim(),
    descriptionAr: String(form.get('descriptionAr') || '').trim(),
    status: String(form.get('status') || 'UNPUBLISHED'),
    priceMad: optionalNumber(form.get('priceMad')),
    neighborhood: String(form.get('neighborhood') || '').trim(),
    transaction: String(form.get('transaction') || '') || undefined,
    bedrooms: optionalNumber(form.get('bedrooms')),
    bathrooms: optionalNumber(form.get('bathrooms')),
    surfaceM2: optionalNumber(form.get('surfaceM2')),
    featured: form.get('featured') === 'on',
  };
}
