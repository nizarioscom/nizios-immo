import type { ReactNode } from 'react';

/** Conteneur de page. Le sens d'écriture vient de <html dir>, pas d'un left/right. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-16 text-start">
      {children}
    </div>
  );
}
