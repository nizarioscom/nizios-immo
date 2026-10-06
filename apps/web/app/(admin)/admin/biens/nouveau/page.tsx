import { PageShell } from '@nizios/ui';
import Link from 'next/link';
import { PropertyFields } from '../../../../../components/property-fields';
import { createProperty } from '../../actions';

export const dynamic = 'force-dynamic';

export default function NewPropertyPage({ searchParams }: { searchParams: { erreur?: string } }) {
  return (
    <PageShell>
      <p className="text-sm">
        <Link href="/admin/biens" className="underline">
          Biens
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold">Nouveau bien</h1>
      {searchParams.erreur ? <p className="mt-4 text-sm text-red-700">Enregistrement impossible. Vérifiez la référence.</p> : null}
      <form action={createProperty} className="mt-6">
        <PropertyFields />
        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm text-white">
          Enregistrer
        </button>
      </form>
    </PageShell>
  );
}
