import { cache } from 'react';

export type PublicTenant = {
  slug: string;
  name: string;
  defaultLocale: string;
  locales: string[];
  branding: { primaryColor?: string };
  districts?: string[];
  content: {
    fr?: { tagline?: string; intro?: string; hero?: string };
    ar?: { tagline?: string; intro?: string; hero?: string };
  };
};

/** Fiche publique. Le serveur Next appelle l'API ; le navigateur ne la voit pas. */
export const fetchTenantByHost = cache(async (host: string): Promise<PublicTenant | null> => {
  const base =
    process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${base}/tenants/resolve?host=${encodeURIComponent(host)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as PublicTenant;
  } catch {
    return null;
  }
});
