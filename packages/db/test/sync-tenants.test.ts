import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { createTenantFromClient } from '../src/sync-tenants';

test('la création d’un tenant lit le dossier client, pas un body libre', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nizios-clients-'));
  const clientDir = path.join(dir, 'riad');
  fs.mkdirSync(path.join(clientDir, 'content'), { recursive: true });
  fs.mkdirSync(path.join(clientDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(clientDir, 'assets', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(
    path.join(clientDir, 'tenant.config.json'),
    JSON.stringify({
      slug: 'riad',
      name: 'Agence Riad',
      status: 'onboarding',
      domains: ['riad.localhost'],
      defaultLocale: 'fr',
      locales: ['fr', 'ar'],
      whatsappNumbers: ['+212611111111'],
      branding: {
        primaryColor: '#14532d',
        logoPath: 'assets/logo.svg',
        tagline: { fr: 'Accroche', ar: 'عبارة' },
      },
      contacts: { city: 'Rabat', districts: ['Hay Riad'], email: '', phone: '' },
      admin: { email: 'admin@riad.test', name: 'Admin Riad' },
      config: { pack: 'presence-digitale-immo' },
    }),
  );
  fs.writeFileSync(
    path.join(clientDir, 'content', 'fr.json'),
    JSON.stringify({ tagline: 'Accroche', intro: 'Texte français du dossier.' }),
  );
  fs.writeFileSync(
    path.join(clientDir, 'content', 'ar.json'),
    JSON.stringify({ tagline: 'عبارة', intro: 'نص عربي' }),
  );

  const calls: Array<{ model: string; args: any }> = [];
  const prisma = {
    tenant: {
      upsert: async (args: any) => {
        calls.push({ model: 'tenant', args });
        return { id: 'tenant-riad' };
      },
    },
    user: {
      upsert: async (args: any) => {
        calls.push({ model: 'user', args });
        return args.create;
      },
    },
  } as unknown as PrismaClient;

  const slug = await createTenantFromClient(prisma, 'riad', {
    clientsDir: dir,
    agencyPassword: 'demo-password',
  });

  assert.equal(slug, 'riad');
  const tenantCall = calls.find((call) => call.model === 'tenant');
  assert.ok(tenantCall);
  assert.equal(tenantCall.args.create.name, 'Agence Riad');
  assert.deepEqual(tenantCall.args.create.domains, ['riad.localhost']);
  assert.deepEqual(tenantCall.args.create.whatsappNumbers, ['+212611111111']);
  assert.equal(tenantCall.args.create.content.fr.intro, 'Texte français du dossier.');
  assert.equal(tenantCall.args.update.name, 'Agence Riad');

  const userCall = calls.find((call) => call.model === 'user');
  assert.ok(userCall);
  assert.equal(userCall.args.create.email, 'admin@riad.test');
  assert.equal(userCall.args.create.tenantId, 'tenant-riad');
  assert.equal(userCall.args.create.role, 'AGENCY_ADMIN');
  assert.notEqual(userCall.args.create.passwordHash, 'demo-password');
  assert.equal(userCall.args.update.passwordHash, undefined);
});
