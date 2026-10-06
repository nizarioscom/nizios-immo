/**
 * Centroïdes de quartiers de Rabat pour le lien carte.
 * Ce n'est pas une adresse exacte : les petites agences n'en ont souvent pas.
 * Vocabulaire du template, pas d'un client.
 */
const POINTS: Record<string, { latitude: number; longitude: number }> = {
  agdal: { latitude: 33.991, longitude: -6.849 },
  'hay riad': { latitude: 33.959, longitude: -6.869 },
  hassan: { latitude: 34.017, longitude: -6.832 },
  souissi: { latitude: 33.973, longitude: -6.823 },
  ocean: { latitude: 34.026, longitude: -6.841 },
};

export function neighborhoodPoint(name: string | null | undefined): { latitude: number; longitude: number } | null {
  if (!name) return null;
  const key = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return POINTS[key] ?? null;
}
