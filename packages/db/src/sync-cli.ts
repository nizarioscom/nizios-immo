import { PrismaClient } from '@prisma/client';
import { syncTenants } from './sync-tenants';

/** Relit `clients/` et met à jour la base. Usage : pnpm db:sync */
async function main() {
  const prisma = new PrismaClient();
  try {
    const slugs = await syncTenants(prisma);
    console.log(`Tenants synchronisés : ${slugs.join(', ') || '(aucun)'}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
