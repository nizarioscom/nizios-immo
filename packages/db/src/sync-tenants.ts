import bcrypt from 'bcryptjs';
import { Prisma, type PrismaClient } from '@prisma/client';
import { loadClientConfig, loadClientConfigs, type ClientConfig } from './load-clients';

/**
 * Crée ou met à jour les tenants à partir des dossiers `clients/<slug>`.
 * Le mot de passe démo n'est écrit qu'à la création du compte.
 * Une synchro suivante ne l'écrase pas.
 */

const DEMO_AGENCY_PASSWORD = 'demo-elhilal-2026';
const DEMO_SUPER_EMAIL = 'admin@nizios.example';
const DEMO_SUPER_PASSWORD = 'demo-nizios-2026';
const DEMO_SUPER_NAME = 'Admin Nizios';

export async function syncTenants(
  prisma: PrismaClient,
  options: { clientsDir?: string; agencyPassword?: string } = {},
): Promise<string[]> {
  const clients = loadClientConfigs(options.clientsDir);
  const password = options.agencyPassword ?? process.env.SEED_ADMIN_PASSWORD ?? DEMO_AGENCY_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);
  for (const client of clients) {
    await upsertClient(prisma, client, passwordHash);
  }
  return clients.map((client) => client.slug);
}

export async function createTenantFromClient(
  prisma: PrismaClient,
  slug: string,
  options: { clientsDir?: string; agencyPassword?: string } = {},
): Promise<string> {
  const client = loadClientConfig(slug, options.clientsDir);
  const password = options.agencyPassword ?? process.env.SEED_ADMIN_PASSWORD ?? DEMO_AGENCY_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);
  await upsertClient(prisma, client, passwordHash);
  return client.slug;
}

async function upsertClient(prisma: PrismaClient, client: ClientConfig, passwordHash: string) {
  const data = {
    name: client.name,
    domains: client.domains,
    defaultLocale: client.defaultLocale,
    locales: client.locales,
    branding: client.branding as Prisma.InputJsonValue,
    whatsappNumbers: client.whatsappNumbers,
    config: client.config as Prisma.InputJsonValue,
    content: client.content as Prisma.InputJsonValue,
  };
  const tenant = await prisma.tenant.upsert({
    where: { slug: client.slug },
    create: { slug: client.slug, ...data },
    update: data,
  });
  if (!client.admin) return;
  await prisma.user.upsert({
    where: { email: client.admin.email },
    create: {
      email: client.admin.email,
      name: client.admin.name,
      passwordHash,
      role: 'AGENCY_ADMIN',
      tenantId: tenant.id,
    },
    update: {
      name: client.admin.name,
      role: 'AGENCY_ADMIN',
      tenantId: tenant.id,
    },
  });
}

export async function upsertSuperAdmin(prisma: PrismaClient): Promise<void> {
  const email = (process.env.NIZIOS_SUPERADMIN_EMAIL ?? DEMO_SUPER_EMAIL).toLowerCase();
  const password = process.env.NIZIOS_SUPERADMIN_PASSWORD ?? DEMO_SUPER_PASSWORD;
  const name = process.env.NIZIOS_SUPERADMIN_NAME ?? DEMO_SUPER_NAME;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
    update: {
      name,
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
  });
}
