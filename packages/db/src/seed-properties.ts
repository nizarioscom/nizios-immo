import fs from 'fs';
import path from 'path';
import type { PrismaClient } from '@prisma/client';
import { findClientsDir } from './load-clients';
import { neighborhoodPoint } from './neighborhoods';
import { withPlatform } from './rls';

/**
 * Insère les biens de démo décrits dans clients/<slug>/properties.json.
 * Un bien déjà présent (même référence) n'est pas réécrit : l'admin peut
 * l'avoir modifié, et un second seed Docker ne doit pas l'écraser.
 */

type SeedPhoto = string;

type SeedProperty = {
  reference: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  status?: 'PUBLISHED' | 'UNPUBLISHED';
  priceMad?: number | null;
  neighborhood?: string;
  transaction?: 'BUY' | 'RENT';
  bedrooms?: number | null;
  bathrooms?: number | null;
  surfaceM2?: number | null;
  featured?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  photos?: SeedPhoto[];
};

const REFERENCE = /^[A-Za-z0-9-]{2,32}$/;

export async function seedDemoProperties(prisma: PrismaClient, clientsDir = findClientsDir()): Promise<number> {
  const slugs = fs
    .readdirSync(clientsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name);

  let created = 0;
  await withPlatform(prisma, async (tx) => {
    for (const slug of slugs) {
      const file = path.join(clientsDir, slug, 'properties.json');
      if (!fs.existsSync(file)) continue;
      const tenant = await tx.tenant.findUnique({ where: { slug } });
      if (!tenant) continue;
      const list = parseList(file);
      for (const item of list) {
        const existing = await tx.property.findUnique({
          where: { tenantId_reference: { tenantId: tenant.id, reference: item.reference } },
        });
        if (existing) continue;
        const point = neighborhoodPoint(item.neighborhood);
        const property = await tx.property.create({
          data: {
            tenantId: tenant.id,
            reference: item.reference,
            title: item.title,
            titleAr: item.titleAr ?? '',
            description: item.description ?? null,
            descriptionAr: item.descriptionAr ?? null,
            status: item.status ?? 'PUBLISHED',
            priceMad: item.priceMad ?? null,
            neighborhood: item.neighborhood ?? null,
            transaction: item.transaction ?? null,
            bedrooms: item.bedrooms ?? null,
            bathrooms: item.bathrooms ?? null,
            surfaceM2: item.surfaceM2 ?? null,
            featured: item.featured ?? false,
            latitude: item.latitude ?? point?.latitude ?? null,
            longitude: item.longitude ?? point?.longitude ?? null,
          },
        });
        const photos = item.photos ?? [];
        for (let index = 0; index < photos.length; index += 1) {
          const relative = photos[index].replace(/\\/g, '/');
          if (relative.includes('..') || relative.startsWith('/')) {
            throw new Error(`Photo invalide dans ${file} : ${relative}`);
          }
          await tx.propertyPhoto.create({
            data: {
              tenantId: tenant.id,
              propertyId: property.id,
              url: `/media/clients/${slug}/${relative}`,
              alt: item.title,
              sortOrder: index,
            },
          });
        }
        created += 1;
      }
    }
  });
  return created;
}

function parseList(file: string): SeedProperty[] {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error(`${file} doit être une liste.`);
  return parsed.map((item, index) => parseItem(item, file, index));
}

function parseItem(value: unknown, file: string, index: number): SeedProperty {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${file}[${index}] doit être un objet.`);
  }
  const row = value as Record<string, unknown>;
  const reference = requiredString(row.reference, file, 'reference');
  if (!REFERENCE.test(reference)) throw new Error(`Référence invalide : ${reference}`);
  const status = row.status === undefined ? 'PUBLISHED' : row.status;
  if (status !== 'PUBLISHED' && status !== 'UNPUBLISHED') {
    throw new Error(`Statut invalide pour ${reference}`);
  }
  const transaction = row.transaction;
  if (transaction !== undefined && transaction !== 'BUY' && transaction !== 'RENT') {
    throw new Error(`Transaction invalide pour ${reference}`);
  }
  const photos = row.photos === undefined ? [] : row.photos;
  if (!Array.isArray(photos) || photos.some((photo) => typeof photo !== 'string')) {
    throw new Error(`photos invalides pour ${reference}`);
  }
  return {
    reference,
    title: requiredString(row.title, file, 'title'),
    titleAr: optionalString(row.titleAr),
    description: optionalString(row.description),
    descriptionAr: optionalString(row.descriptionAr),
    status,
    priceMad: optionalInt(row.priceMad),
    neighborhood: optionalString(row.neighborhood),
    transaction,
    bedrooms: optionalInt(row.bedrooms),
    bathrooms: optionalInt(row.bathrooms),
    surfaceM2: optionalInt(row.surfaceM2),
    featured: row.featured === true,
    latitude: optionalNumber(row.latitude),
    longitude: optionalNumber(row.longitude),
    photos,
  };
}

function requiredString(value: unknown, file: string, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} manquant dans ${file}`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error('Chaîne attendue.');
  return value;
}

function optionalInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error('Entier attendu.');
  return value;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number') throw new Error('Nombre attendu.');
  return value;
}
