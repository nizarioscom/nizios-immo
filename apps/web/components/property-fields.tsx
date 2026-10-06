import type { AdminProperty } from '../lib/admin-api';

export function PropertyFields({ property }: { property?: AdminProperty }) {
  return (
    <div className="grid gap-3">
      <label className="text-sm">
        Référence
        <input name="reference" required defaultValue={property?.reference ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="text-sm">
        Titre (français)
        <input name="title" required defaultValue={property?.title ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="text-sm">
        Titre (arabe)
        <input name="titleAr" dir="rtl" defaultValue={property?.titleAr ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="text-sm">
        Description
        <textarea name="description" defaultValue={property?.description ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" rows={3} />
      </label>
      <label className="text-sm">
        Description (arabe)
        <textarea name="descriptionAr" dir="rtl" defaultValue={property?.descriptionAr ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" rows={3} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Prix (MAD)
          <input name="priceMad" inputMode="numeric" defaultValue={property?.priceMad ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="text-sm">
          Quartier
          <input name="neighborhood" defaultValue={property?.neighborhood ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="text-sm">
          Transaction
          <select name="transaction" defaultValue={property?.transaction ?? ''} className="mt-1 w-full rounded-md border bg-white px-3 py-2">
            <option value="">—</option>
            <option value="BUY">Achat</option>
            <option value="RENT">Location</option>
          </select>
        </label>
        <label className="text-sm">
          Statut
          <select name="status" defaultValue={property?.status ?? 'UNPUBLISHED'} className="mt-1 w-full rounded-md border bg-white px-3 py-2">
            <option value="UNPUBLISHED">Non publié</option>
            <option value="PUBLISHED">Publié</option>
          </select>
        </label>
        <label className="text-sm">
          Chambres
          <input name="bedrooms" inputMode="numeric" defaultValue={property?.bedrooms ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="text-sm">
          Salles d&apos;eau
          <input name="bathrooms" inputMode="numeric" defaultValue={property?.bathrooms ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="text-sm">
          Surface (m²)
          <input name="surfaceM2" inputMode="numeric" defaultValue={property?.surfaceM2 ?? ''} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={property?.featured ?? false} />
        Bien vedette
      </label>
    </div>
  );
}
