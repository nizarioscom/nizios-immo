import type { ReactNode } from 'react';

export const metadata = {
  title: 'Panel Nizios',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, Segoe UI, Tahoma, sans-serif',
          background: '#fafaf9',
          color: '#1c1917',
        }}
      >
        {children}
      </body>
    </html>
  );
}
