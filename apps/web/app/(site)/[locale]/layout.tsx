import { getDictionary, isLocale, isRtl } from '@nizios/i18n';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ChatLauncher } from '../../../components/chat-launcher';
import '../../globals.css';

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const dictionary = getDictionary(params.locale);
  return (
    <html lang={params.locale} dir={isRtl(params.locale) ? 'rtl' : 'ltr'}>
      <body className="bg-white text-stone-900 antialiased">
        {children}
        <ChatLauncher
          labels={{
            open: dictionary.chatOpen,
            close: dictionary.chatClose,
            send: dictionary.chatSend,
            placeholder: dictionary.chatPlaceholder,
          }}
        />
      </body>
    </html>
  );
}
