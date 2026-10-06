/**
 * Mobile marocain : 06 ou 07, dix chiffres.
 * Accepte aussi +212 6/7 et le 6/7 sans le zéro.
 * Retourne le format local 06XXXXXXXX utilisé dans le message WhatsApp.
 */
export function normalizeMoroccanMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let local = '';
  if (digits.startsWith('212') && digits.length === 12) local = `0${digits.slice(3)}`;
  else if (digits.startsWith('0') && digits.length === 10) local = digits;
  else if (/^[67]\d{8}$/.test(digits)) local = `0${digits}`;
  if (!/^0[67]\d{8}$/.test(local)) return null;
  return local;
}

/** 2126XXXXXXXX, sans plus, pour wa.me et l'API Cloud. */
export function toWhatsappDigits(localOrRaw: string): string | null {
  const local = normalizeMoroccanMobile(localOrRaw);
  if (!local) return null;
  return `212${local.slice(1)}`;
}
