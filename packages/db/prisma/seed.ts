import { PrismaClient } from '@prisma/client';
import { seedDemoProperties } from '../src/seed-properties';
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
    const properties = await seedDemoProperties(prisma);
    console.log(
      `Seed OK. Clients : ${slugs.join(', ')}. Super-admin Nizios assuré. Biens créés : ${properties}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
