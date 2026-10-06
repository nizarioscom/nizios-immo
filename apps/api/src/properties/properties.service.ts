import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { findClientsDir, neighborhoodPoint, Prisma } from '@nizios/db';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { TenantScopedReader } from '../common/tenant-scoped.reader';
import { TenantScopeError, requireTenantId, type Actor } from '../common/tenant-scope';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import type { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { toAdminProperty, toPublicProperty, type PropertyRecord } from './property.presenter';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reader: TenantScopedReader,
    private readonly tenants: TenantsService,
  ) {}

  async listPublic(host: string, query: { quartier?: string; type?: string; budget?: string; featured?: string }) {
    const tenant = await this.tenants.findByHost(host);
    const budget = query.budget ? Number(query.budget) : undefined;
    const transaction = query.type === 'BUY' || query.type === 'RENT' ? query.type : undefined;
    const rows = await this.prisma.forTenant(tenant.id, (tx) =>
      tx.property.findMany({
        where: {
          tenantId: tenant.id,
          status: 'PUBLISHED',
          ...(query.quartier ? { neighborhood: { equals: query.quartier, mode: 'insensitive' } } : {}),
          ...(transaction ? { transaction } : {}),
          ...(query.featured === '1' ? { featured: true } : {}),
          ...(budget && Number.isFinite(budget) ? { priceMad: { lte: budget } } : {}),
        },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
    );
    const phone = tenant.whatsappNumbers[0] ?? null;
    return rows.map((row) => toPublicProperty(row as PropertyRecord, phone));
  }

  async getPublic(host: string, reference: string, locale: 'fr' | 'ar') {
    const tenant = await this.tenants.findByHost(host);
    const row = await this.prisma.forTenant(tenant.id, (tx) =>
      tx.property.findFirst({
        where: { tenantId: tenant.id, reference, status: 'PUBLISHED' },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
      }),
    );
    if (!row) throw new NotFoundException('Bien introuvable.');
    return toPublicProperty(row as PropertyRecord, tenant.whatsappNumbers[0] ?? null, locale);
  }

  async list(actor: Actor, requestedTenantId?: string) {
    const rows = await this.guard(() => this.reader.listProperties(actor, requestedTenantId));
    return rows.map((row) => toAdminProperty(row as PropertyRecord));
  }

  async get(actor: Actor, id: string, requestedTenantId?: string) {
    const row = await this.guard(() => this.reader.getProperty(actor, id, requestedTenantId));
    if (!row) throw new NotFoundException('Bien introuvable.');
    return toAdminProperty(row as PropertyRecord);
  }

  async create(actor: Actor, dto: CreatePropertyDto) {
    const tenantId = this.scope(actor, dto.tenantId);
    const point = neighborhoodPoint(dto.neighborhood);
    try {
      const row = await this.prisma.forTenant(tenantId, (tx) =>
        tx.property.create({
          data: {
            tenantId,
            reference: dto.reference,
            title: dto.title,
            titleAr: dto.titleAr ?? '',
            description: dto.description ?? null,
            descriptionAr: dto.descriptionAr ?? null,
            status: dto.status ?? 'UNPUBLISHED',
            priceMad: dto.priceMad ?? null,
            neighborhood: dto.neighborhood ?? null,
            transaction: dto.transaction ?? null,
            bedrooms: dto.bedrooms ?? null,
            bathrooms: dto.bathrooms ?? null,
            surfaceM2: dto.surfaceM2 ?? null,
            featured: dto.featured ?? false,
            latitude: dto.latitude ?? point?.latitude ?? null,
            longitude: dto.longitude ?? point?.longitude ?? null,
          },
          include: { photos: true },
        }),
      );
      return toAdminProperty(row as PropertyRecord);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(actor: Actor, id: string, dto: UpdatePropertyDto) {
    const tenantId = this.scope(actor, dto.tenantId);
    const current = await this.prisma.forTenant(tenantId, (tx) =>
      tx.property.findFirst({ where: { id, tenantId } }),
    );
    if (!current) throw new NotFoundException('Bien introuvable.');
    const neighborhood = dto.neighborhood === undefined ? current.neighborhood : dto.neighborhood;
    const point = neighborhoodPoint(neighborhood);
    const data: Prisma.PropertyUpdateInput = {
      ...(dto.reference !== undefined ? { reference: dto.reference } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.titleAr !== undefined ? { titleAr: dto.titleAr } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.descriptionAr !== undefined ? { descriptionAr: dto.descriptionAr } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priceMad !== undefined ? { priceMad: dto.priceMad } : {}),
      ...(dto.neighborhood !== undefined ? { neighborhood: dto.neighborhood } : {}),
      ...(dto.transaction !== undefined ? { transaction: dto.transaction } : {}),
      ...(dto.bedrooms !== undefined ? { bedrooms: dto.bedrooms } : {}),
      ...(dto.bathrooms !== undefined ? { bathrooms: dto.bathrooms } : {}),
      ...(dto.surfaceM2 !== undefined ? { surfaceM2: dto.surfaceM2 } : {}),
      ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
      ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
      ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
    };
    if (dto.latitude === undefined && dto.longitude === undefined && dto.neighborhood && point) {
      data.latitude = point.latitude;
      data.longitude = point.longitude;
    }
    try {
      const row = await this.prisma.forTenant(tenantId, (tx) =>
        tx.property.update({
          where: { id },
          data,
          include: { photos: { orderBy: { sortOrder: 'asc' } } },
        }),
      );
      return toAdminProperty(row as PropertyRecord);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async addPhoto(actor: Actor, id: string, file: { buffer: Buffer; mimetype: string }, tenantQuery?: string) {
    if (!file?.buffer?.length) throw new BadRequestException('Photo manquante.');
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      throw new BadRequestException('Format accepté : JPEG, PNG, WEBP ou GIF.');
    }
    const tenantId = this.scope(actor, tenantQuery);
    const property = await this.prisma.forTenant(tenantId, (tx) =>
      tx.property.findFirst({
        where: { id, tenantId },
        include: { photos: true },
      }),
    );
    if (!property) throw new NotFoundException('Bien introuvable.');
    const sharp = (await import('sharp')).default;
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    const name = `${randomUUID()}.webp`;
    const dir = path.join(path.dirname(findClientsDir()), 'uploads', tenantId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), buffer);
    const sortOrder = property.photos.reduce((max, photo) => Math.max(max, photo.sortOrder), -1) + 1;
    await this.prisma.forTenant(tenantId, (tx) =>
      tx.propertyPhoto.create({
        data: {
          tenantId,
          propertyId: id,
          url: `/media/uploads/${tenantId}/${name}`,
          alt: property.title,
          sortOrder,
        },
      }),
    );
    return this.get(actor, id, tenantQuery);
  }

  async reorderPhotos(actor: Actor, id: string, ids: string[], tenantQuery?: string) {
    const tenantId = this.scope(actor, tenantQuery);
    await this.prisma.forTenant(tenantId, async (tx) => {
      const photos = await tx.propertyPhoto.findMany({ where: { propertyId: id, tenantId } });
      const known = new Set(photos.map((photo) => photo.id));
      if (ids.length !== known.size || ids.some((photoId) => !known.has(photoId))) {
        throw new BadRequestException('Liste de photos invalide.');
      }
      for (let index = 0; index < ids.length; index += 1) {
        await tx.propertyPhoto.update({ where: { id: ids[index] }, data: { sortOrder: index } });
      }
    });
    return this.get(actor, id, tenantQuery);
  }

  async removePhoto(actor: Actor, id: string, photoId: string, tenantQuery?: string) {
    const tenantId = this.scope(actor, tenantQuery);
    const photo = await this.prisma.forTenant(tenantId, (tx) =>
      tx.propertyPhoto.findFirst({ where: { id: photoId, propertyId: id, tenantId } }),
    );
    if (!photo) throw new NotFoundException('Photo introuvable.');
    await this.prisma.forTenant(tenantId, (tx) => tx.propertyPhoto.delete({ where: { id: photoId } }));
    if (photo.url.startsWith('/media/uploads/')) {
      const root = path.dirname(findClientsDir());
      const file = path.join(root, photo.url.replace(/^\/media\//, ''));
      if (file.startsWith(path.join(root, 'uploads') + path.sep) && fs.existsSync(file)) fs.unlinkSync(file);
    }
    return this.get(actor, id, tenantQuery);
  }

  private async guard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof TenantScopeError) throw new ForbiddenException(error.message);
      throw error;
    }
  }

  private scope(actor: Actor, requested?: string) {
    try {
      return requireTenantId(actor, requested);
    } catch (error) {
      if (error instanceof TenantScopeError) throw new ForbiddenException(error.message);
      throw error;
    }
  }

  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Cette référence existe déjà pour cette agence.');
    }
    throw error;
  }
}
