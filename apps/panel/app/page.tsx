export default function PanelHome() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 12 }}>Nizios</p>
      <h1 style={{ fontSize: 32, fontWeight: 600 }}>Panel interne</h1>
      <p>
        Squelette du Jour 1. La liste des clients, le clonage et les abonnements ne sont pas
        encore branchés.
      </p>
      <p>
        Chaque agence se configure dans <code>clients/&lt;slug&gt;/</code>, sans code spécifique.
        Le premier dossier est <code>clients/elhilal/</code>.
      </p>
    </main>
  );
}
