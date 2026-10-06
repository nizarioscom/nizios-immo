import { Injectable } from '@nestjs/common';
import type { Actor } from './tenant-scope';
import { requireTenantId } from './tenant-scope';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Seul point de lecture des biens et des leads.
 * Les modules HTTP de ces domaines viendront plus tard ; ils doivent passer ici.
 */
@Injectable()
export class TenantScopedReader {
  constructor(private readonly prisma: PrismaService) {}

  async listProperties(actor: Actor, requestedTenantId?: string) {
    const tenantId = requireTenantId(actor, requestedTenantId);
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.property.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  async getProperty(actor: Actor, id: string, requestedTenantId?: string) {
    const tenantId = requireTenantId(actor, requestedTenantId);
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.property.findFirst({
        where: { id, tenantId },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
      }),
    );
  }

  async listLeads(actor: Actor, requestedTenantId?: string) {
    const tenantId = requireTenantId(actor, requestedTenantId);
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.lead.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    );
  }

  async getLead(actor: Actor, id: string, requestedTenantId?: string) {
    const tenantId = requireTenantId(actor, requestedTenantId);
    return this.prisma.forTenant(tenantId, (tx) => tx.lead.findFirst({ where: { id, tenantId } }));
  }
}
