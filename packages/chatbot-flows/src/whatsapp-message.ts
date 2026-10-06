import { normalizeMoroccanMobile, toWhatsappDigits } from './phone';

export type LeadNotice = {
  intent: 'BUY' | 'RENT';
  neighborhood: string;
  budget: string;
  timeline: string;
  name: string;
  phone: string;
};

/** Message agence, toujours en français, quel que soit la langue du visiteur. */
export function formatLeadMessage(lead: LeadNotice): string {
  const intent = lead.intent === 'BUY' ? 'achat' : 'location';
  const phone = normalizeMoroccanMobile(lead.phone) ?? lead.phone;
  return `🔔 Nouveau lead : ${intent} — ${lead.neighborhood} — ${lead.budget} — ${lead.timeline} | Nom : ${lead.name} — Tél : ${phone}`;
}

export function propertyWhatsappText(reference: string, title: string, locale: 'ar' | 'fr'): string {
  if (locale === 'ar') return `السلام، مهتم بالعين ${reference} — ${title}`;
  return `Bonjour, je suis intéressé(e) par le bien ${reference} — ${title}`;
}

export function waMeUrl(phone: string, text: string): string | null {
  const digits = toWhatsappDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
