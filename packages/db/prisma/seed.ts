import { PrismaClient } from '@prisma/client';
import { syncTenants, upsertSuperAdmin } from '../src/sync-tenants';

/**
 * Seed idempotent : lit chaque dossier clients/<slug> (pas `_template`)
 * puis assure le super-admin Nizios.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const slugs = await syncTenants(prisma);
    await upsertSuperAdmin(prisma);
    console.log(`Seed OK. Clients : ${slugs.join(', ')}. Super-admin Nizios assuré.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
