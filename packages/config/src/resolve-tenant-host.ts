/**
 * Déduit un slug de tenant à partir de l'en-tête Host.
 *
 * Convention plateforme (aucun client en dur) :
 * - `<slug>.localhost`
 * - `<slug>.nizarios.fr`
 *
 * Les domaines propres (ex. elhilal.ma) ne sont pas devinés ici.
 * Ils vivent dans `clients/<slug>/tenant.config.json` et, en secours
 * middleware, dans la variable TENANT_HOST_MAP.
 *
 * nizarios.fr / www.nizarios.fr est le site de l'agence Nizios, pas un client.
 */

const PLATFORM_APEX = new Set(['nizarios.fr', 'www.nizarios.fr']);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeHost(hostHeader: string): string {
  return hostHeader.split(':')[0].trim().toLowerCase().replace(/\.$/, '');
}

export function resolveTenantHost(
  hostHeader: string,
  hostMap: Record<string, string> = {},
): string | null {
  const host = normalizeHost(hostHeader);
  if (!host || PLATFORM_APEX.has(host)) return null;

  const mapped = hostMap[host];
  if (mapped) return SLUG.test(mapped) ? mapped : null;

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length);
    return SLUG.test(slug) ? slug : null;
  }

  const parts = host.split('.');
  if (parts.length === 3 && parts[1] === 'nizarios' && parts[2] === 'fr' && parts[0] !== 'www') {
    return SLUG.test(parts[0]) ? parts[0] : null;
  }

  return null;
}
