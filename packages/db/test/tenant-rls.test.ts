import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { after, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { withTenant } from '../src/rls';

/**
 * Prouve l'isolation Postgres : même sans filtre SQL explicite,
 * le tenant A ne lit pas les biens du tenant B.
 * Ignoré si PostgreSQL n'est pas joignable.
 */

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '../../.env'));

const databaseUrl = process.env.DATABASE_URL;
const prisma = databaseUrl ? new PrismaClient() : null;

const tenantA = '00000000-0000-4000-8000-0000000000a1';
const tenantB = '00000000-0000-4000-8000-0000000000b1';
const propertyA = '00000000-0000-4000-8000-0000000000a2';
const propertyB = '00000000-0000-4000-8000-0000000000b2';

let ready = false;

test('RLS : le tenant A ne voit pas les biens du tenant B', async (t) => {
  if (!prisma) {
    t.skip('DATABASE_URL absent');
    return;
  }
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    t.skip('PostgreSQL injoignable');
    return;
  }

  try {
    await prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', false)`;
    await prisma.property.deleteMany({ where: { id: { in: [propertyA, propertyB] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('does not exist') || message.includes('n\'existe pas')) {
      t.skip('Migration non appliquée');
      return;
    }
    throw error;
  }

  ready = true;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
    await tx.tenant.create({
      data: {
        id: tenantA,
        slug: 'rls-a',
        name: 'RLS A',
        domains: ['rls-a.localhost'],
        branding: {},
        whatsappNumbers: [],
      },
    });
    await tx.tenant.create({
      data: {
        id: tenantB,
        slug: 'rls-b',
        name: 'RLS B',
        domains: ['rls-b.localhost'],
        branding: {},
        whatsappNumbers: [],
      },
    });
    await tx.property.create({
      data: { id: propertyA, tenantId: tenantA, title: 'Bien A', status: 'PUBLISHED' },
    });
    await tx.property.create({
      data: { id: propertyB, tenantId: tenantB, title: 'Bien B', status: 'PUBLISHED' },
    });
  });

  const visible = await withTenant(prisma, tenantA, (tx) => tx.property.findMany());
  assert.deepEqual(
    visible.map((row) => row.id).sort(),
    [propertyA],
  );
  assert.equal(
    visible.some((row) => row.tenantId === tenantB),
    false,
  );

  const hidden = await withTenant(prisma, tenantA, (tx) =>
    tx.property.findFirst({ where: { id: propertyB } }),
  );
  assert.equal(hidden, null);
});

after(async () => {
  if (!prisma || !ready) {
    await prisma?.$disconnect();
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
    await tx.property.deleteMany({ where: { id: { in: [propertyA, propertyB] } } });
    await tx.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
  });
  await prisma.$disconnect();
});
