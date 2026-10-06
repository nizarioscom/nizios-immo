export type ChatLocale = 'ar' | 'fr';

export type FlowOption = {
  value: string;
  label: Record<ChatLocale, string>;
  synonyms?: string[];
};

export type FlowStep =
  | { type: 'message'; text: Record<ChatLocale, string>; next: string }
  | {
      type: 'choice';
      field: string;
      prompt: Record<ChatLocale, string>;
      options: FlowOption[];
      next: string | Record<string, string>;
    }
  | { type: 'text'; field: string; prompt: Record<ChatLocale, string>; next: string }
  | {
      type: 'phone';
      field: string;
      prompt: Record<ChatLocale, string>;
      invalid: Record<ChatLocale, string>;
      next: string;
    }
  | { type: 'end' };

export type Flow = {
  id: string;
  version: number;
  entry: string;
  nudge: Record<ChatLocale, string>;
  doneText: Record<ChatLocale, string>;
  steps: Record<string, FlowStep>;
};

export type QuickReply = { value: string; label: string };

export type ChatAnswers = {
  intent?: 'BUY' | 'RENT';
  budget?: string;
  neighborhood?: string;
  timeline?: string;
  name?: string;
  phone?: string;
};

/** État sérialisable. Le délai de relance se calcule avec updatedAt. */
export type ChatState = {
  locale: ChatLocale;
  stepId: string;
  answers: ChatAnswers;
  nudged: boolean;
  done: boolean;
  updatedAt: number;
};

export type ChatTurn = {
  state: ChatState;
  messages: string[];
  quickReplies: QuickReply[];
  done: boolean;
};

export const NUDGE_AFTER_MS = 10 * 60 * 1000;
