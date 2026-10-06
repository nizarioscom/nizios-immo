'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminFetch, propertyPayload } from '../../../lib/admin-api';

export async function createProperty(form: FormData) {
  const response = await adminFetch('/properties', {
    method: 'POST',
    body: JSON.stringify(propertyPayload(form)),
  });
  if (!response.ok) redirect('/admin/biens/nouveau?erreur=1');
  const created = (await response.json()) as { id: string };
  revalidatePath('/admin/biens');
  redirect(`/admin/biens/${created.id}`);
}

export async function updateProperty(id: string, form: FormData) {
  const response = await adminFetch(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(propertyPayload(form)),
  });
  revalidatePath('/admin/biens');
  revalidatePath(`/admin/biens/${id}`);
  redirect(response.ok ? `/admin/biens/${id}?enregistre=1` : `/admin/biens/${id}?erreur=1`);
}

export async function setPublished(id: string, published: boolean) {
  await adminFetch(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: published ? 'PUBLISHED' : 'UNPUBLISHED' }),
  });
  revalidatePath('/admin/biens');
  revalidatePath(`/admin/biens/${id}`);
}

export async function uploadPhoto(id: string, form: FormData) {
  const response = await adminFetch(`/properties/${id}/photos`, { method: 'POST', body: form });
  revalidatePath(`/admin/biens/${id}`);
  redirect(response.ok ? `/admin/biens/${id}` : `/admin/biens/${id}?erreur=1`);
}

export async function movePhoto(id: string, photoId: string, direction: 'up' | 'down') {
  const current = await adminFetch(`/properties/${id}`);
  if (!current.ok) return;
  const property = (await current.json()) as { photos: { id: string }[] };
  const ids = property.photos.map((photo) => photo.id).filter(Boolean);
  const index = ids.indexOf(photoId);
  const swap = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swap < 0 || swap >= ids.length) return;
  const next = [...ids];
  const [item] = next.splice(index, 1);
  next.splice(swap, 0, item);
  await adminFetch(`/properties/${id}/photos/order`, {
    method: 'POST',
    body: JSON.stringify({ ids: next }),
  });
  revalidatePath(`/admin/biens/${id}`);
}

export async function deletePhoto(id: string, photoId: string) {
  await adminFetch(`/properties/${id}/photos/${photoId}`, { method: 'DELETE' });
  revalidatePath(`/admin/biens/${id}`);
}
