import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { test } from 'node:test';
import {
  ClientConfigError,
  findClientsDir,
  loadClientConfig,
  loadClientConfigs,
} from '../src/load-clients';

test('le dossier elhilal est chargé, le modèle _template est ignoré', () => {
  const clients = loadClientConfigs(findClientsDir());
  const slugs = clients.map((client) => client.slug);
  assert.deepEqual(slugs, ['elhilal']);
  const elhilal = clients[0];
  assert.equal(elhilal.name, 'Elhilal');
  assert.ok(elhilal.domains.includes('elhilal.localhost'));
  assert.ok(elhilal.domains.includes('localhost'));
  assert.deepEqual(elhilal.locales, ['fr', 'ar']);
  assert.equal(elhilal.whatsappNumbers[0], '+212600000026');
  assert.equal(elhilal.content.fr.tagline, 'Agence immobilière à Rabat');
  assert.equal(typeof elhilal.content.ar.intro, 'string');
  assert.equal(elhilal.admin?.email, 'admin@elhilal.example');
});

test('un slug qui ne correspond pas au dossier est refusé', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nizios-clients-'));
  const clientDir = path.join(dir, 'riad');
  fs.mkdirSync(path.join(clientDir, 'content'), { recursive: true });
  fs.mkdirSync(path.join(clientDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(clientDir, 'assets', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.writeFileSync(
    path.join(clientDir, 'tenant.config.json'),
    JSON.stringify({
      slug: 'autre',
      name: 'Autre',
      status: 'onboarding',
      domains: ['autre.localhost'],
      defaultLocale: 'fr',
      locales: ['fr', 'ar'],
      whatsappNumbers: [],
      branding: {
        primaryColor: '#14532d',
        logoPath: 'assets/logo.svg',
        tagline: { fr: 'fr', ar: 'ar' },
      },
      contacts: { city: 'Rabat', districts: [], email: '', phone: '' },
    }),
  );
  fs.writeFileSync(path.join(clientDir, 'content', 'fr.json'), '{"tagline":"fr"}');
  fs.writeFileSync(path.join(clientDir, 'content', 'ar.json'), '{"tagline":"ar"}');
  assert.throws(() => loadClientConfig('riad', dir), ClientConfigError);
});

test('un fichier de code dans le dossier client est refusé', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nizios-clients-'));
  const clientDir = path.join(dir, 'riad');
  fs.mkdirSync(clientDir, { recursive: true });
  fs.writeFileSync(path.join(clientDir, 'theme.ts'), 'export const x = 1;\n');
  assert.throws(() => loadClientConfig('riad', dir), /interdit/);
});
