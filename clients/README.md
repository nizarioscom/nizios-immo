# Clients

Un dossier = un client. Le nom du dossier **est** le slug.

```
clients/
  _template/     modèle à copier, jamais chargé en base
  elhilal/       agence n°26, Rabat
```

Chaque dossier ne contient que de la configuration et des contenus :

| Fichier | Rôle |
| --- | --- |
| `tenant.config.json` | Nom, domaines, langues, WhatsApp, branding, contact admin démo |
| `content/fr.json` `content/ar.json` | Textes du site |
| `assets/` | Logo et photos (pas de code) |
| `google-maps-checklist.md` | Checklist Google du client |
| `README.md` | Statut et contacts |

Le seed (`pnpm db:seed`), la synchro (`pnpm db:sync`) et `POST /tenants` lisent ces dossiers. Aucun fichier `.ts`, `.tsx` ou `.js` n'est accepté.
