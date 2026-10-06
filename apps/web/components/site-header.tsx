import type { Dictionary, Locale } from '@nizios/i18n';

export function SiteHeader({
  locale,
  dictionary,
  name,
  color,
}: {
  locale: Locale;
  dictionary: Dictionary;
  name: string;
  color: string;
}) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <a href={`/${locale}`} className="text-lg font-semibold" style={{ color }}>
        {name}
      </a>
      <nav className="flex items-center gap-4 text-sm">
        <a className="underline" href={`/${locale}/biens`}>
          {dictionary.allListings}
        </a>
        <a className="underline" href={`/${dictionary.otherLocale}`}>
          {dictionary.otherLanguage}
        </a>
      </nav>
    </header>
  );
}
