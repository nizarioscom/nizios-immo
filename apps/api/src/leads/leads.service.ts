import { BadRequestException, ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { formatLeadMessage, normalizeMoroccanMobile } from '@nizios/chatbot-flows';
import { RateLimiter } from '../common/rate-limit';
import { TenantScopeError, type Actor } from '../common/tenant-scope';
import { TenantScopedReader } from '../common/tenant-scoped.reader';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { WhatsappService, type WhatsappDelivery } from '../whatsapp/whatsapp.service';
import type { CreatePublicLeadDto } from './dto/create-lead.dto';

export type StoredLeadInput = {
  tenantId: string;
  source: 'SITE' | 'CHATBOT';
  name: string;
  phone: string;
  intent: 'BUY' | 'RENT';
  budgetLabel: string;
  budgetMad: number | null;
  neighborhood: string;
  timeline: string;
  propertyId?: string | null;
  notes?: string | null;
};

@Injectable()
export class LeadsService {
  private readonly siteLimit = new RateLimiter(5, 10 * 60 * 1000);
  private readonly chatLimit = new RateLimiter(5, 10 * 60 * 1000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reader: TenantScopedReader,
    private readonly tenants: TenantsService,
    private readonly whatsapp: WhatsappService,
  ) {}

  list(actor: Actor, requestedTenantId?: string) {
    return this.guard(() => this.reader.listLeads(actor, requestedTenantId));
  }

  /**
   * Formulaire du site. Le honeypot répond comme un succès, sans rien enregistrer.
   * Au plus 5 envois par IP et par 10 minutes.
   */
  async createFromSite(dto: CreatePublicLeadDto, ip: string) {
    if (dto.website?.trim()) return { ok: true as const, ignored: true as const };
    if (!this.siteLimit.allow(`site:${ip}`)) {
      throw new HttpException('Trop de demandes. Réessayez dans quelques minutes.', 429);
    }
    const phone = normalizeMoroccanMobile(dto.phone);
    if (!phone) throw new BadRequestException('Téléphone marocain attendu : 06 ou 07.');
    const budgetMad = /^\d{1,9}$/.test(dto.budget) ? Number(dto.budget) : null;
    if (budgetMad === null || budgetMad <= 0) {
      throw new BadRequestException('Budget en dirhams attendu.');
    }
    const tenant = await this.tenants.findByHost(dto.host);
    const property = dto.propertyReference
      ? await this.prisma.forTenant(tenant.id, (tx) =>
          tx.property.findFirst({
            where: { tenantId: tenant.id, reference: dto.propertyReference, status: 'PUBLISHED' },
          }),
        )
      : null;
    const saved = await this.persistAndNotify(tenant.whatsappNumbers[0] ?? null, {
      tenantId: tenant.id,
      source: 'SITE',
      name: dto.name.trim(),
      phone,
      intent: dto.intent,
      budgetLabel: `${budgetMad} MAD`,
      budgetMad,
      neighborhood: dto.neighborhood.trim(),
      timeline: dto.timeline,
      propertyId: property?.id ?? null,
      notes: property ? `Réf. ${property.reference}` : null,
    });
    return { ok: true as const, id: saved.lead.id, whatsapp: saved.delivery };
  }

  async createFromChat(input: StoredLeadInput, agencyPhone: string | null, ip: string) {
    if (!this.chatLimit.allow(`chat:${ip}`)) {
      throw new HttpException('Trop de demandes. Réessayez dans quelques minutes.', 429);
    }
    return this.persistAndNotify(agencyPhone, input);
  }

  private async persistAndNotify(agencyPhone: string | null, input: StoredLeadInput) {
    const lead = await this.prisma.forTenant(input.tenantId, (tx) =>
      tx.lead.create({
        data: {
          tenantId: input.tenantId,
          source: input.source,
          name: input.name,
          phone: input.phone,
          intent: input.intent,
          budgetMad: input.budgetMad,
          budgetLabel: input.budgetLabel,
          neighborhood: input.neighborhood,
          timeline: input.timeline,
          status: 'NEW',
          propertyId: input.propertyId ?? null,
          notes: input.notes ?? null,
        },
      }),
    );
    const message = formatLeadMessage({
      intent: input.intent,
      neighborhood: input.neighborhood,
      budget: input.budgetLabel,
      timeline: input.timeline,
      name: input.name,
      phone: input.phone,
    });
    const delivery: WhatsappDelivery = agencyPhone
      ? await this.whatsapp.notifyAgency(agencyPhone, message)
      : { channel: 'wa.me', url: null };
    return { lead, message, delivery };
  }

  private async guard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof TenantScopeError) throw new ForbiddenException(error.message);
      throw error;
    }
  }
}
