import type { ReactNode } from 'react';

/** Conteneur de page. Le sens d'écriture vient de <html dir>, pas d'un left/right. */
export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const width = wide ? 'max-w-5xl' : 'max-w-3xl';
  return (
    <div className={`mx-auto flex min-h-screen w-full ${width} flex-col px-6 py-10 text-start`}>
      {children}
    </div>
  );
}
