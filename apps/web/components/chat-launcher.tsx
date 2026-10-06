'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';

type PanelProps = {
  labels: { close: string; send: string; placeholder: string };
};

/**
 * Le bouton est léger. Le panneau (et ses appels) n'est chargé qu'au clic.
 */
export function ChatLauncher({ labels }: { labels: PanelProps['labels'] & { open: string } }) {
  const [open, setOpen] = useState(false);
  const [Panel, setPanel] = useState<ComponentType<PanelProps> | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    if (!Panel) {
      const loaded = await import('./chat-panel');
      setPanel(() => loaded.ChatPanel);
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        data-chat-open="1"
        onClick={toggle}
        className="fixed bottom-4 end-4 z-20 rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
      >
        {open ? labels.close : labels.open}
      </button>
      {open && Panel ? <Panel labels={labels} /> : null}
    </>
  );
}
