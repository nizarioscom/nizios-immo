import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDictionary, isRtl } from '../src/index';

test('arabe en RTL, français en LTR', () => {
  assert.equal(isRtl('ar'), true);
  assert.equal(isRtl('fr'), false);
  assert.equal(getDictionary('ar').search.length > 0, true);
  assert.notEqual(getDictionary('fr').search, getDictionary('ar').search);
});
