import type { Dictionary, Locale } from '@nizios/i18n';

export function SearchForm({
  locale,
  dictionary,
  districts,
  values,
}: {
  locale: Locale;
  dictionary: Dictionary;
  districts: string[];
  values?: { quartier?: string; type?: string; budget?: string };
}) {
  return (
    <form action={`/${locale}/biens`} method="get" className="grid gap-3 sm:grid-cols-4">
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.neighborhood}</span>
        <select
          name="quartier"
          defaultValue={values?.quartier ?? ''}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
        >
          <option value="">{dictionary.anyNeighborhood}</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.type}</span>
        <select
          name="type"
          defaultValue={values?.type ?? ''}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
        >
          <option value="">{dictionary.anyType}</option>
          <option value="BUY">{dictionary.buy}</option>
          <option value="RENT">{dictionary.rent}</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-stone-600">{dictionary.budget}</span>
        <input
          name="budget"
          inputMode="numeric"
          defaultValue={values?.budget ?? ''}
          placeholder={dictionary.budgetHint}
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <div className="flex items-end">
        <button type="submit" className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {dictionary.search}
        </button>
      </div>
    </form>
  );
}
