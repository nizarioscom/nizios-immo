import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectLocale,
  leadFromAnswers,
  loadDefaultFlow,
  nudgeChat,
  sendChat,
  startChat,
  withNeighborhoods,
} from '../src/engine';
import { NUDGE_AFTER_MS } from '../src/types';
import { normalizeMoroccanMobile } from '../src/phone';
import { formatLeadMessage } from '../src/whatsapp-message';

const flow = loadDefaultFlow();
const ctx = (now: number) => ({ agency: 'Elhilal', now });

test('téléphone marocain 06 et 07', () => {
  assert.equal(normalizeMoroccanMobile('06 12 34 56 78'), '0612345678');
  assert.equal(normalizeMoroccanMobile('+212 7 00 00 00 26'), '0700000026');
  assert.equal(normalizeMoroccanMobile('05 22 00 00 00'), null);
});

test('message WhatsApp au format agence', () => {
  assert.equal(
    formatLeadMessage({
      intent: 'BUY',
      neighborhood: 'Agdal',
      budget: '450000 MAD',
      timeline: 'urgent',
      name: 'Sara',
      phone: '0611223344',
    }),
    '🔔 Nouveau lead : achat — Agdal — 450000 MAD — urgent | Nom : Sara — Tél : 0611223344',
  );
});

test('cycle darija avec boutons et synonymes', () => {
  const now = 1_000;
  let turn = startChat(flow, ctx(now));
  assert.equal(turn.state.locale, 'ar');
  assert.match(turn.messages.join(' '), /السلام/);
  turn = sendChat(flow, turn.state, { text: 'شرا' }, ctx(now + 1));
  assert.equal(turn.state.locale, 'ar');
  assert.equal(turn.state.answers.intent, 'BUY');
  turn = sendChat(flow, turn.state, { value: '<300k' }, ctx(now + 2));
  assert.equal(turn.state.answers.budget, '<300k');
  turn = sendChat(flow, turn.state, { value: 'Agdal' }, ctx(now + 3));
  turn = sendChat(flow, turn.state, { value: 'urgent' }, ctx(now + 4));
  turn = sendChat(flow, turn.state, { text: 'يوسف' }, ctx(now + 5));
  assert.equal(turn.state.locale, 'ar');
  turn = sendChat(flow, turn.state, { text: '0612345678' }, ctx(now + 6));
  assert.equal(turn.done, true);
  assert.match(turn.messages.join(' '), /شكرا/);
  const lead = leadFromAnswers(turn.state.answers);
  assert.equal(lead?.intent, 'BUY');
  assert.equal(lead?.phone, '0612345678');
  assert.equal(lead?.name, 'يوسف');
});

test('« chra » ne bascule pas en français, « kra » veut dire location', () => {
  let turn = startChat(flow, ctx(10));
  turn = sendChat(flow, turn.state, { text: 'chra' }, ctx(11));
  assert.equal(turn.state.locale, 'ar');
  assert.equal(turn.state.answers.intent, 'BUY');
  turn = startChat(flow, ctx(10));
  turn = sendChat(flow, turn.state, { text: 'kra' }, ctx(11));
  assert.equal(turn.state.answers.intent, 'RENT');
  assert.equal(turn.state.locale, 'ar');
  assert.equal(detectLocale('Bonjour, location'), 'fr');
});

test('cycle français si le visiteur écrit en français', () => {
  let turn = startChat(flow, ctx(20));
  turn = sendChat(flow, turn.state, { text: 'Bonjour, je cherche une location' }, ctx(21));
  assert.equal(turn.state.locale, 'fr');
  assert.equal(turn.state.answers.intent, 'RENT');
  assert.match(turn.messages.join(' '), /loyer|budget/i);
  turn = sendChat(flow, turn.state, { value: '<3k' }, ctx(22));
  turn = sendChat(flow, turn.state, { value: 'Hassan' }, ctx(23));
  turn = sendChat(flow, turn.state, { value: 'simple info' }, ctx(24));
  turn = sendChat(flow, turn.state, { text: 'Sara' }, ctx(25));
  turn = sendChat(flow, turn.state, { text: '05 22 11 22 33' }, ctx(26));
  assert.equal(turn.done, false);
  assert.match(turn.messages.join(' '), /06 ou 07/);
  turn = sendChat(flow, turn.state, { text: '0700112233' }, ctx(27));
  assert.equal(turn.done, true);
  assert.equal(leadFromAnswers(turn.state.answers)?.phone, '0700112233');
  assert.match(turn.messages.join(' '), /Merci/);
});

test('une seule relance, et pas avant 10 minutes', () => {
  const turn = startChat(flow, ctx(0));
  assert.deepEqual(nudgeChat(flow, turn.state, 1_000), { error: 'too_soon' });
  const nudged = nudgeChat(flow, turn.state, NUDGE_AFTER_MS);
  assert.equal('messages' in nudged, true);
  if (!('messages' in nudged)) return;
  assert.equal(nudged.state.nudged, true);
  assert.match(nudged.messages[0], /مازال/);
  assert.deepEqual(nudgeChat(flow, nudged.state, NUDGE_AFTER_MS * 3), { error: 'already' });
});

test('les quartiers du tenant remplacent la liste, avec Autre', () => {
  const custom = withNeighborhoods(flow, ['Agdal', 'Yacoub El Mansour']);
  const step = custom.steps.neighborhood;
  assert.equal(step.type, 'choice');
  if (step.type !== 'choice') return;
  assert.deepEqual(
    step.options.map((option) => option.value),
    ['Agdal', 'Yacoub El Mansour', 'Autre'],
  );
});
