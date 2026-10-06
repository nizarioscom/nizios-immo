import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveTenantHost } from '../src/resolve-tenant-host';

test('sous-domaine localhost', () => {
  assert.equal(resolveTenantHost('elhilal.localhost'), 'elhilal');
  assert.equal(resolveTenantHost('elhilal.localhost:3000'), 'elhilal');
  assert.equal(resolveTenantHost('ELHILAL.localhost'), 'elhilal');
  assert.equal(resolveTenantHost('agence-b.localhost'), 'agence-b');
});

test('sous-domaine de la plateforme nizarios.fr', () => {
  assert.equal(resolveTenantHost('elhilal.nizarios.fr'), 'elhilal');
  assert.equal(resolveTenantHost('nizarios.fr'), null);
  assert.equal(resolveTenantHost('www.nizarios.fr'), null);
  assert.equal(resolveTenantHost('elhilal.nizarios.fr.evil.test'), null);
});

test('hôte nu seulement via la carte de config', () => {
  assert.equal(resolveTenantHost('localhost'), null);
  assert.equal(resolveTenantHost('127.0.0.1'), null);
  assert.equal(
    resolveTenantHost('localhost:3000', { localhost: 'elhilal' }),
    'elhilal',
  );
});

test('rejette un slug invalide', () => {
  assert.equal(resolveTenantHost('El_Hilal.localhost'), null);
  assert.equal(resolveTenantHost('localhost', { localhost: '../etc' }), null);
});
