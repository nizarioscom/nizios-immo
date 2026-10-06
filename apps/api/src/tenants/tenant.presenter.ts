type TenantRecord = {
  id: string;
  slug: string;
  name: string;
  domains: string[];
  defaultLocale: string;
  locales: string[];
  branding: unknown;
  whatsappNumbers: string[];
  config: unknown;
  content: unknown;
};

function districtsOf(config: unknown): string[] {
  if (!config || typeof config !== 'object') return [];
  const contacts = (config as { contacts?: { districts?: unknown } }).contacts;
  if (!contacts || !Array.isArray(contacts.districts)) return [];
  return contacts.districts.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

/** Réponse publique : pas de numéros, pas de config interne. Les quartiers servent à la recherche. */
export function toPublicTenant(tenant: TenantRecord) {
  return {
    slug: tenant.slug,
    name: tenant.name,
    defaultLocale: tenant.defaultLocale,
    locales: tenant.locales,
    branding: tenant.branding,
    content: tenant.content,
    districts: districtsOf(tenant.config),
  };
}

export function toAdminTenant(tenant: TenantRecord) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    domains: tenant.domains,
    defaultLocale: tenant.defaultLocale,
    locales: tenant.locales,
    branding: tenant.branding,
    whatsappNumbers: tenant.whatsappNumbers,
    config: tenant.config,
    content: tenant.content,
  };
}
