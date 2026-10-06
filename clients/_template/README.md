# Nouveau client

1. Copier ce dossier vers `clients/<slug>/` (lettres minuscules, chiffres, tirets).
2. Remplacer les valeurs `CHANGEME` dans `tenant.config.json`. Le champ `slug` doit être **identique** au nom du dossier.
3. Écrire les textes dans `content/fr.json` et `content/ar.json`.
4. Déposer le logo dans `assets/logo.svg` (ou `.png`) et les photos dans `assets/`.
5. Remplir `google-maps-checklist.md`.
6. Mettre à jour ce README : statut, ville, contacts.
7. Lancer `pnpm db:sync` (ou `POST /tenants` avec le slug, en super-admin).

Ne pas ajouter de code ici. Tout le comportement passe par la config.
