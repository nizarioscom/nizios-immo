import { PageShell } from '@nizios/ui';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropertyFields } from '../../../../../components/property-fields';
import { adminFetch, type AdminProperty } from '../../../../../lib/admin-api';
import { deletePhoto, movePhoto, setPublished, updateProperty, uploadPhoto } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erreur?: string; enregistre?: string };
}) {
  const response = await adminFetch(`/properties/${params.id}`);
  if (response.status === 404) notFound();
  if (!response.ok) notFound();
  const property = (await response.json()) as AdminProperty;
  const published = property.status === 'PUBLISHED';

  return (
    <PageShell wide>
      <p className="text-sm">
        <Link href="/admin/biens" className="underline">
          Biens
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{property.reference}</h1>
        <form action={setPublished.bind(null, property.id, !published)}>
          <button type="submit" className="rounded-md border border-stone-300 px-4 py-2 text-sm">
            {published ? 'Dépublier' : 'Publier'}
          </button>
        </form>
      </div>
      {searchParams.enregistre ? <p className="mt-4 text-sm text-emerald-800">Enregistré.</p> : null}
      {searchParams.erreur ? <p className="mt-4 text-sm text-red-700">Enregistrement impossible.</p> : null}
      <form action={updateProperty.bind(null, property.id)} className="mt-6">
        <PropertyFields property={property} />
        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm text-white">
          Enregistrer
        </button>
      </form>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Photos</h2>
        <p className="mt-1 text-sm text-stone-600">JPEG, PNG ou WEBP. Redimensionnées en WEBP, largeur max 1600.</p>
        <ul className="mt-4 grid gap-4">
          {property.photos.map((photo, index) => (
            <li key={photo.id ?? photo.url} className="flex items-center gap-4">
              <Image src={photo.url} alt={photo.alt || property.title} width={160} height={100} className="h-16 w-24 rounded object-cover" />
              <div className="flex gap-2 text-sm">
                <form action={movePhoto.bind(null, property.id, photo.id || '', 'up')}>
                  <button type="submit" disabled={index === 0} className="underline disabled:opacity-40">
                    Monter
                  </button>
                </form>
                <form action={movePhoto.bind(null, property.id, photo.id || '', 'down')}>
                  <button type="submit" disabled={index === property.photos.length - 1} className="underline disabled:opacity-40">
                    Descendre
                  </button>
                </form>
                <form action={deletePhoto.bind(null, property.id, photo.id || '')}>
                  <button type="submit" className="underline">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <form action={uploadPhoto.bind(null, property.id)} className="mt-4 flex items-center gap-3">
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          <button type="submit" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            Ajouter
          </button>
        </form>
      </section>
    </PageShell>
  );
}
