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

/** Réponse publique : pas de numéros, pas de config interne. */
export function toPublicTenant(tenant: TenantRecord) {
  return {
    slug: tenant.slug,
    name: tenant.name,
    defaultLocale: tenant.defaultLocale,
    locales: tenant.locales,
    branding: tenant.branding,
    content: tenant.content,
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
