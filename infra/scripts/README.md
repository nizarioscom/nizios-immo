# Scripts

Pas de script métier au Jour 1. Pour créer un tenant :

```bash
cp -R clients/_template clients/<slug>
# éditer la config, puis :
pnpm db:sync
```

`pnpm db:sync` relit tous les dossiers `clients/<slug>` (pas `_template`).
