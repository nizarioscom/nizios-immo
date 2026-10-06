import { NextResponse } from 'next/server';

/** Le formulaire HTML poste ici. On ajoute l'hôte et l'IP, puis l'API enregistre le lead. */
export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = String(form.get('returnTo') || '/fr');
  const safe = /^\/(fr|ar)(\/|$)/.test(returnTo) ? returnTo : '/fr';
  const host = request.headers.get('x-tenant-host') || request.headers.get('host') || '';
  const base = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const payload = {
    host,
    name: String(form.get('name') || ''),
    phone: String(form.get('phone') || ''),
    intent: String(form.get('intent') || ''),
    budget: String(form.get('budget') || ''),
    neighborhood: String(form.get('neighborhood') || ''),
    timeline: String(form.get('timeline') || ''),
    propertyReference: String(form.get('propertyReference') || '') || undefined,
    website: String(form.get('website') || ''),
  };
  const forwarded = request.headers.get('x-forwarded-for') || '';
  let ok = false;
  try {
    const response = await fetch(`${base}/public/leads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': forwarded },
      body: JSON.stringify(payload),
    });
    ok = response.ok;
  } catch {
    ok = false;
  }
  const url = new URL(safe, request.url);
  url.searchParams.set(ok ? 'envoye' : 'erreur', '1');
  return NextResponse.redirect(url, 303);
}
