'use client';

import { useEffect, useRef, useState } from 'react';

type Reply = { value: string; label: string };
type Turn = {
  messages: string[];
  quickReplies: Reply[];
  done: boolean;
  locale: 'ar' | 'fr';
  sessionId: string;
  whatsapp?: { url?: string | null } | null;
};

/**
 * Une seule relance, 10 minutes après le dernier message.
 * Le serveur refuse une deuxième, et refuse aussi si le délai n'est pas passé.
 */
const NUDGE_MS = 10 * 60 * 1000;

export function ChatPanel({
  labels,
}: {
  labels: { close: string; send: string; placeholder: string };
}) {
  const [sessionId, setSessionId] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [done, setDone] = useState(false);
  const [locale, setLocale] = useState<'ar' | 'fr'>('ar');
  const [text, setText] = useState('');
  const [wa, setWa] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/chat/start', { method: 'POST' })
      .then((response) => response.json())
      .then((turn: Turn) => {
        if (cancelled) return;
        setSessionId(turn.sessionId);
        setLines(turn.messages ?? []);
        setReplies(turn.quickReplies ?? []);
        setLocale(turn.locale ?? 'ar');
      })
      .catch(() => setLines(['…']));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId || done) return;
    const timer = window.setTimeout(() => {
      fetch('/api/chat/nudge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((response) => response.json())
        .then((turn: Partial<Turn> & { error?: string }) => {
          if (turn.messages?.length) setLines((current) => [...current, ...turn.messages!]);
        })
        .catch(() => undefined);
    }, NUDGE_MS);
    return () => window.clearTimeout(timer);
  }, [sessionId, done, tick]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines]);

  async function send(body: { text?: string; value?: string }) {
    if (!sessionId || done) return;
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, ...body }),
    });
    const turn = (await response.json()) as Turn;
    setLines((current) => [...current, ...(turn.messages ?? [])]);
    setReplies(turn.quickReplies ?? []);
    setDone(Boolean(turn.done));
    if (turn.locale) setLocale(turn.locale);
    if (turn.whatsapp?.url) setWa(turn.whatsapp.url);
    setTick((value) => value + 1);
    setText('');
  }

  return (
    <section
      data-chat-panel="1"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="fixed bottom-20 end-4 z-20 flex max-h-[70vh] w-[min(100vw-2rem,22rem)] flex-col rounded-lg border border-stone-200 bg-white shadow-xl"
    >
      <div ref={box} className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 text-sm">
        {lines.map((line, index) => (
          <p key={`${index}-${line.slice(0, 12)}`} className="rounded-md bg-stone-100 px-3 py-2 text-start">
            {line}
          </p>
        ))}
        {wa ? (
          <a data-chat-wa="1" className="text-sm underline" href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        ) : null}
      </div>
      {replies.length > 0 && !done ? (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {replies.map((reply) => (
            <button
              key={reply.value}
              type="button"
              className="rounded-full border border-stone-300 px-3 py-1 text-sm"
              onClick={() => send({ value: reply.value })}
            >
              {reply.label}
            </button>
          ))}
        </div>
      ) : null}
      {!done ? (
        <form
          className="flex gap-2 border-t border-stone-200 p-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim()) void send({ text: text.trim() });
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded-md bg-stone-900 px-3 py-1 text-sm text-white">
            {labels.send}
          </button>
        </form>
      ) : null}
    </section>
  );
}
