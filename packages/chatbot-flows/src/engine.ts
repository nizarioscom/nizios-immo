import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeMoroccanMobile } from './phone';
import type {
  ChatAnswers,
  ChatLocale,
  ChatState,
  ChatTurn,
  Flow,
  FlowOption,
  FlowStep,
  QuickReply,
} from './types';
import { NUDGE_AFTER_MS } from './types';

/**
 * Moteur rule-based. Un interpréteur (Gemini, plus tard) peut remplacer
 * `matchOption` sans changer le JSON du flow : il suffit de passer
 * `interpret` à `sendChat`.
 */
export type ChatInterpret = (input: {
  text: string;
  step: FlowStep;
  locale: ChatLocale;
}) => { value?: string; locale?: ChatLocale } | null;

export type ChatContext = {
  agency: string;
  now: number;
  interpret?: ChatInterpret;
};

const ARABIC = /[\u0600-\u06FF]/;
const LATIN = /[A-Za-z]/;

export function loadDefaultFlow(): Flow {
  const file = join(__dirname, 'flows', 'default.json');
  return JSON.parse(readFileSync(file, 'utf8')) as Flow;
}

const AR_LABELS: Record<string, string> = {
  agdal: 'أكدال',
  'hay riad': 'حي الرياض',
  hassan: 'حسان',
  souissi: 'السويسي',
  ocean: 'المحيط',
  océan: 'المحيط',
  autre: 'حي آخر',
};

/** Remplace la liste de quartiers par celle du tenant, sans toucher au reste du flow. */
export function withNeighborhoods(flow: Flow, names: string[]): Flow {
  const step = flow.steps.neighborhood;
  if (!names.length || !step || step.type !== 'choice') return flow;
  const listed = names.some((name) => name.trim().toLowerCase() === 'autre') ? names : [...names, 'Autre'];
  const options: FlowOption[] = listed.map((name) => {
    const key = name.trim().toLowerCase();
    const ar = AR_LABELS[key] ?? name;
    return {
      value: name,
      label: { ar, fr: name },
      synonyms: [name, key, ar],
    };
  });
  return {
    ...flow,
    steps: { ...flow.steps, neighborhood: { ...step, options } },
  };
}

export function mergeFlow(base: Flow, override: Partial<Flow> | null): Flow {
  if (!override) return base;
  return {
    ...base,
    ...override,
    nudge: { ...base.nudge, ...(override.nudge ?? {}) },
    doneText: { ...base.doneText, ...(override.doneText ?? {}) },
    steps: { ...base.steps, ...(override.steps ?? {}) },
  };
}

const FRENCH = /\b(bonjour|achat|acheter|location|louer|loyer|maison|appartement|cherche|quartier|urgent|mois|info|information|moins|plus|vous|bonjour)\b/i;

/**
 * Darija en lettres arabes par défaut.
 * On ne bascule en français que si le texte ressemble au français.
 * « chra » ou « kra » restent en darija : ce sont des synonymes, pas du français.
 */
export function detectLocale(text: string): ChatLocale | null {
  const hasAr = ARABIC.test(text);
  const hasLat = LATIN.test(text);
  if (hasAr && !hasLat) return 'ar';
  if (hasLat && !hasAr) return FRENCH.test(text) ? 'fr' : null;
  if (hasAr && hasLat) return FRENCH.test(text) ? 'fr' : 'ar';
  return null;
}

function fill(text: string, agency: string): string {
  return text.replaceAll('{{agency}}', agency);
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function candidatesOf(option: FlowOption): string[] {
  return [option.value, option.label.ar, option.label.fr, ...(option.synonyms ?? [])].map(normalize).filter(Boolean);
}

/**
 * Égalité d'abord. Sinon un synonyme d'au moins 4 caractères,
 * comme mot entier (« location » dans « Bonjour, je cherche une location »).
 */
function matchOption(step: Extract<FlowStep, { type: 'choice' }>, raw: string): FlowOption | null {
  const needle = normalize(raw);
  if (!needle) return null;
  for (const option of step.options) {
    if (candidatesOf(option).some((item) => item === needle)) return option;
  }
  let best: { option: FlowOption; length: number } | null = null;
  for (const option of step.options) {
    for (const item of candidatesOf(option)) {
      if (item.length < 4) continue;
      const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(needle)) continue;
      if (!best || item.length > best.length) best = { option, length: item.length };
    }
  }
  return best?.option ?? null;
}

function replies(step: FlowStep, locale: ChatLocale): QuickReply[] {
  if (step.type !== 'choice') return [];
  return step.options.map((option) => ({ value: option.value, label: option.label[locale] }));
}

function nextId(step: FlowStep, value?: string): string | null {
  if (step.type === 'end') return null;
  if (step.type === 'choice' && value && typeof step.next === 'object') {
    return step.next[value] ?? null;
  }
  if (typeof (step as { next?: string }).next === 'string') return (step as { next: string }).next;
  return null;
}

function blankState(entry: string, now: number): ChatState {
  return { locale: 'ar', stepId: entry, answers: {}, nudged: false, done: false, updatedAt: now };
}

/** Avance les étapes « message » toutes seules, jusqu'à une question ou la fin. */
function drain(flow: Flow, state: ChatState, agency: string): { state: ChatState; messages: string[] } {
  const messages: string[] = [];
  let current = state;
  for (let guard = 0; guard < 12; guard += 1) {
    const step = flow.steps[current.stepId];
    if (!step) break;
    if (step.type === 'message') {
      messages.push(fill(step.text[current.locale], agency));
      current = { ...current, stepId: step.next };
      continue;
    }
    if (step.type === 'end') {
      messages.push(fill(flow.doneText[current.locale], agency));
      current = { ...current, done: true };
    }
    break;
  }
  return { state: current, messages };
}

function waiting(flow: Flow, state: ChatState, agency: string, prior: string[]): ChatTurn {
  if (state.done) {
    return { state, messages: prior, quickReplies: [], done: true };
  }
  const step = flow.steps[state.stepId];
  const messages = [...prior];
  if (step && step.type !== 'end' && step.type !== 'message' && 'prompt' in step) {
    messages.push(fill(step.prompt[state.locale], agency));
  }
  return { state, messages, quickReplies: step ? replies(step, state.locale) : [], done: false };
}

export function startChat(flow: Flow, ctx: ChatContext): ChatTurn {
  const drained = drain(flow, blankState(flow.entry, ctx.now), ctx.agency);
  return waiting(flow, { ...drained.state, updatedAt: ctx.now }, ctx.agency, drained.messages);
}

export function sendChat(
  flow: Flow,
  state: ChatState,
  input: { text?: string; value?: string },
  ctx: ChatContext,
): ChatTurn {
  if (state.done) {
    return { state, messages: [fill(flow.doneText[state.locale], ctx.agency)], quickReplies: [], done: true };
  }
  const step = flow.steps[state.stepId];
  if (!step || step.type === 'end' || step.type === 'message') {
    return waiting(flow, state, ctx.agency, []);
  }

  const raw = (input.value ?? input.text ?? '').trim();
  let locale = state.locale;
  if (input.text && !input.value) {
    const detected = ctx.interpret?.({ text: input.text, step, locale })?.locale ?? detectLocale(input.text);
    if (detected) locale = detected;
  }

  const fail = (hint: string): ChatTurn =>
    waiting(flow, { ...state, locale, updatedAt: ctx.now }, ctx.agency, [hint]);

  if (!raw) {
    return fail(step.prompt[locale]);
  }

  let stored: string | null = null;
  if (step.type === 'choice') {
    const interpreted = input.text && !input.value ? ctx.interpret?.({ text: input.text, step, locale }) : null;
    const option = (interpreted?.value && step.options.find((item) => item.value === interpreted.value)) || matchOption(step, raw);
    if (!option) return fail(step.prompt[locale]);
    stored = option.value;
  } else if (step.type === 'phone') {
    const phone = normalizeMoroccanMobile(raw);
    if (!phone) return fail(step.invalid[locale]);
    stored = phone;
  } else {
    if (raw.length > 80) return fail(step.prompt[locale]);
    stored = raw;
  }

  const answers: ChatAnswers = { ...state.answers };
  if (step.field === 'intent' && (stored === 'BUY' || stored === 'RENT')) answers.intent = stored;
  else if (step.field === 'budget') answers.budget = stored;
  else if (step.field === 'neighborhood') answers.neighborhood = stored;
  else if (step.field === 'timeline') answers.timeline = stored;
  else if (step.field === 'name') answers.name = stored;
  else if (step.field === 'phone') answers.phone = stored;
  const following = nextId(step, stored);
  if (!following) return fail(step.prompt[locale]);
  const drained = drain(flow, { ...state, locale, answers, stepId: following, updatedAt: ctx.now }, ctx.agency);
  return waiting(flow, drained.state, ctx.agency, drained.messages);
}

export function nudgeChat(flow: Flow, state: ChatState, now: number): ChatTurn | { error: 'too_soon' | 'already' | 'done' } {
  if (state.done) return { error: 'done' };
  if (state.nudged) return { error: 'already' };
  if (now - state.updatedAt < NUDGE_AFTER_MS) return { error: 'too_soon' };
  return {
    state: { ...state, nudged: true, updatedAt: now },
    messages: [flow.nudge[state.locale]],
    quickReplies: replies(flow.steps[state.stepId], state.locale),
    done: false,
  };
}

export function leadFromAnswers(answers: ChatAnswers): {
  intent: 'BUY' | 'RENT';
  budgetLabel: string;
  neighborhood: string;
  timeline: string;
  name: string;
  phone: string;
} | null {
  if (!answers.intent || !answers.budget || !answers.neighborhood || !answers.timeline || !answers.name || !answers.phone) {
    return null;
  }
  return {
    intent: answers.intent,
    budgetLabel: answers.budget,
    neighborhood: answers.neighborhood,
    timeline: answers.timeline,
    name: answers.name,
    phone: answers.phone,
  };
}
