import { isLocale, isRtl } from '@nizios/i18n';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import '../../globals.css';

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  return (
    <html lang={params.locale} dir={isRtl(params.locale) ? 'rtl' : 'ltr'}>
      <body className="bg-white text-stone-900 antialiased">{children}</body>
    </html>
  );
}
