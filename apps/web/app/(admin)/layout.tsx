import type { ReactNode } from 'react';
import '../globals.css';

export const metadata = {
  title: 'Espace agence — Nizios',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
