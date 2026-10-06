import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Pose le tenant Postgres pour la durée d'une transaction.
 * Avec FORCE ROW LEVEL SECURITY, une requête qui oublie le filtre
 * ne voit que les lignes de ce tenant (ou aucune si le réglage est vide).
 * Le superuser contourne toujours le RLS : le rôle applicatif ne doit pas l'être.
 */
export async function withTenant<T>(
  prisma: PrismaClient,
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'off', true)`;
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

/** Seed, migrations de données, super-admin : désactive le RLS sur cette transaction seulement. */
export async function withPlatform<T>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
    return fn(tx);
  });
}
