export type Actor = {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'AGENCY_ADMIN';
  tenantId: string | null;
};

export class TenantScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantScopeError';
  }
}

/**
 * Tenant autorisé pour une lecture métier (biens, leads, fiche agence).
 * Un admin d'agence ne peut nommer que son tenant.
 * Le super-admin Nizios doit indiquer le tenant : pas d'accès implicite à tout.
 */
export function requireTenantId(actor: Actor, requestedTenantId?: string): string {
  if (actor.role === 'SUPER_ADMIN') {
    if (!requestedTenantId) {
      throw new TenantScopeError('Le super-admin doit indiquer un tenant.');
    }
    return requestedTenantId;
  }
  if (actor.role !== 'AGENCY_ADMIN' || !actor.tenantId) {
    throw new TenantScopeError('Compte agence sans tenant.');
  }
  if (requestedTenantId && requestedTenantId !== actor.tenantId) {
    throw new TenantScopeError('Accès refusé : ces données appartiennent à un autre tenant.');
  }
  return actor.tenantId;
}
