import { TenantScopedReader } from './tenant-scoped.reader';
import { TenantScopeError, type Actor } from './tenant-scope';
import type { PrismaService } from '../prisma/prisma.service';

const tenantA = 'tenant-a';
const tenantB = 'tenant-b';

const properties = [
  { id: 'p-a', tenantId: tenantA, title: 'Appartement Agdal' },
  { id: 'p-b', tenantId: tenantB, title: 'Villa Hay Riad' },
];

const leads = [
  { id: 'l-a', tenantId: tenantA, name: 'Sara' },
  { id: 'l-b', tenantId: tenantB, name: 'Omar' },
];

const actorA: Actor = {
  id: 'user-a',
  email: 'a@elhilal.example',
  name: 'Admin A',
  role: 'AGENCY_ADMIN',
  tenantId: tenantA,
};

const actorB: Actor = {
  id: 'user-b',
  email: 'b@autre.example',
  name: 'Admin B',
  role: 'AGENCY_ADMIN',
  tenantId: tenantB,
};

const superAdmin: Actor = {
  id: 'user-s',
  email: 'admin@nizios.example',
  name: 'Nizios',
  role: 'SUPER_ADMIN',
  tenantId: null,
};

function readerWith(spy?: { calls: string[] }) {
  const prisma = {
    forTenant: jest.fn(async (tenantId: string, fn: (tx: unknown) => Promise<unknown>) => {
      spy?.calls.push(tenantId);
      const tx = {
        property: {
          findMany: async ({ where }: { where: { tenantId: string } }) =>
            properties.filter((row) => row.tenantId === where.tenantId),
          findFirst: async ({ where }: { where: { tenantId: string; id: string } }) =>
            properties.find((row) => row.id === where.id && row.tenantId === where.tenantId) ?? null,
        },
        lead: {
          findMany: async ({ where }: { where: { tenantId: string } }) =>
            leads.filter((row) => row.tenantId === where.tenantId),
          findFirst: async ({ where }: { where: { tenantId: string; id: string } }) =>
            leads.find((row) => row.id === where.id && row.tenantId === where.tenantId) ?? null,
        },
      };
      return fn(tx);
    }),
  };
  return new TenantScopedReader(prisma as unknown as PrismaService);
}

describe('isolation tenant', () => {
  it('un admin du tenant A ne liste pas les biens du tenant B', async () => {
    const reader = readerWith();
    const rows = await reader.listProperties(actorA);
    expect(rows.map((row) => row.id)).toEqual(['p-a']);
    expect(rows.some((row) => row.tenantId === tenantB)).toBe(false);
  });

  it('un admin du tenant A ne peut pas ouvrir un bien du tenant B', async () => {
    const reader = readerWith();
    await expect(reader.getProperty(actorA, 'p-b')).resolves.toBeNull();
    await expect(reader.getProperty(actorA, 'p-b', tenantB)).rejects.toBeInstanceOf(TenantScopeError);
  });

  it('ne interroge pas la base si le tenant demandé est interdit', async () => {
    const spy = { calls: [] as string[] };
    const reader = readerWith(spy);
    await expect(reader.getLead(actorA, 'l-b', tenantB)).rejects.toBeInstanceOf(TenantScopeError);
    expect(spy.calls).toEqual([]);
  });

  it('isole aussi les leads', async () => {
    const reader = readerWith();
    const rows = await reader.listLeads(actorB);
    expect(rows.map((row) => row.id)).toEqual(['l-b']);
    await expect(reader.getLead(actorB, 'l-a')).resolves.toBeNull();
  });

  it('le super-admin doit nommer le tenant', async () => {
    const reader = readerWith();
    await expect(reader.listProperties(superAdmin)).rejects.toBeInstanceOf(TenantScopeError);
    const rows = await reader.listProperties(superAdmin, tenantB);
    expect(rows.map((row) => row.id)).toEqual(['p-b']);
  });
});
