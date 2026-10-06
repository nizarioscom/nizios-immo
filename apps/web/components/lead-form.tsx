import type { Dictionary, Locale } from '@nizios/i18n';

/** Formulaire sans JavaScript. Le champ website est un piège à robots. */
export function LeadForm({
  locale,
  dictionary,
  districts,
  defaults,
  sent,
  failed,
}: {
  locale: Locale;
  dictionary: Dictionary;
  districts: string[];
  defaults?: { intent?: 'BUY' | 'RENT'; neighborhood?: string; reference?: string };
  sent: boolean;
  failed: boolean;
}) {
  if (sent) {
    return (
      <p data-lead-sent="1" className="rounded-md bg-emerald-50 px-4 py-3 text-emerald-900">
        {dictionary.sent}
      </p>
    );
  }
  return (
    <form action="/api/leads" method="post" className="relative grid gap-3">
      <input type="hidden" name="returnTo" value={defaults?.reference ? `/${locale}/biens/${defaults.reference}` : `/${locale}/biens`} />
      {defaults?.reference ? <input type="hidden" name="propertyReference" value={defaults.reference} /> : null}
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.name}</span>
        <input name="name" required maxLength={80} className="w-full rounded-md border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.phone}</span>
        <input name="phone" required inputMode="tel" autoComplete="tel" className="w-full rounded-md border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.type}</span>
        <select name="intent" defaultValue={defaults?.intent ?? 'BUY'} className="w-full rounded-md border border-stone-300 bg-white px-3 py-2">
          <option value="BUY">{dictionary.buy}</option>
          <option value="RENT">{dictionary.rent}</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.budget}</span>
        <input name="budget" required inputMode="numeric" className="w-full rounded-md border border-stone-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.neighborhood}</span>
        <select name="neighborhood" defaultValue={defaults?.neighborhood ?? districts[0] ?? ''} className="w-full rounded-md border border-stone-300 bg-white px-3 py-2">
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.timeline}</span>
        <select name="timeline" defaultValue="ce mois-ci" className="w-full rounded-md border border-stone-300 bg-white px-3 py-2">
          <option value="urgent">{dictionary.timelineUrgent}</option>
          <option value="ce mois-ci">{dictionary.timelineMonth}</option>
          <option value="simple info">{dictionary.timelineInfo}</option>
        </select>
      </label>
      {failed ? <p className="text-sm text-red-700">{dictionary.sendError}</p> : null}
      <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
        {dictionary.send}
      </button>
    </form>
  );
}
