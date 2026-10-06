import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { normalizeHost, resolveTenantHost } from '@nizios/config';
import { createTenantFromClient, syncTenants } from '@nizios/db';
import { TenantScopeError, requireTenantId, type Actor } from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';
import { toAdminTenant, toPublicTenant } from './tenant.presenter';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Résolution publique par hôte. Les domaines du dossier client font foi. */
  async resolveByHost(hostHeader: string) {
    const host = normalizeHost(hostHeader);
    if (!host) throw new NotFoundException('Tenant introuvable.');
    const tenants = await this.prisma.tenant.findMany();
    const byDomain = tenants.find((tenant) =>
      tenant.domains.some((domain) => domain.toLowerCase() === host),
    );
    const match =
      byDomain ?? tenants.find((tenant) => tenant.slug === resolveTenantHost(host));
    if (!match) throw new NotFoundException('Tenant introuvable.');
    return toPublicTenant(match);
  }

  async list(actor: Actor) {
    this.assertSuperAdmin(actor);
    const tenants = await this.prisma.tenant.findMany({ orderBy: { name: 'asc' } });
    return tenants.map(toAdminTenant);
  }

  async getById(actor: Actor, id: string) {
    const tenantId = this.scopedId(actor, id);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant introuvable.');
    return toAdminTenant(tenant);
  }

  /** Crée ou met à jour un tenant en relisant clients/<slug>/. */
  createFromFolder(actor: Actor, slug: string) {
    this.assertSuperAdmin(actor);
    return createTenantFromClient(this.prisma, slug);
  }

  syncFromFolders(actor: Actor) {
    this.assertSuperAdmin(actor);
    return syncTenants(this.prisma);
  }

  private scopedId(actor: Actor, requestedId: string) {
    try {
      return requireTenantId(actor, requestedId);
    } catch (error) {
      if (error instanceof TenantScopeError) throw new ForbiddenException(error.message);
      throw error;
    }
  }

  private assertSuperAdmin(actor: Actor) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Réservé à Nizios.');
    }
  }
}
