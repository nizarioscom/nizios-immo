# Nizios Immo

Template multi-tenant du **Pack Présence Digitale Immo** (2 900 MAD), pour les petites agences immobilières de Rabat. Premier client : **Elhilal** (`clients/elhilal`).

Le domaine de l'agence Nizios reste `nizarios.fr`. Les sites clients sont des sous-domaines (`elhilal.nizarios.fr`) ou des domaines propres déclarés dans la config du client.

Règle d'or : **rien de spécifique à un client dans le code**. Un nouveau client = un dossier `clients/<slug>/`, puis une synchro. Objectif de mise en route : moins de 4 h de travail, 48 h de bout en bout.

## Lancer en local

Prérequis : Node 20+, pnpm 10, PostgreSQL 16 (ou Docker).

```bash
cp .env.example .env
pnpm install
```

### Postgres sans Docker

Le rôle applicatif ne doit **pas** être superuser (sinon le row-level security est ignoré).

```bash
sudo -u postgres psql -c "CREATE USER nizios WITH PASSWORD 'nizios' NOSUPERUSER CREATEDB LOGIN;"
sudo -u postgres psql -c "CREATE DATABASE nizios OWNER nizios;"
pnpm db:migrate
pnpm db:seed
```

### Ou avec Docker

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Compose démarre Postgres, applique les migrations, relit `clients/` et lance l'API (port 3001) et le site (port 3000).

### Site et API en développement

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Site : http://localhost:3000/fr et http://localhost:3000/ar (`dir="rtl"` en arabe)
- Connexion agence : http://localhost:3000/admin/login
- API : http://localhost:3001/health
- Panel interne (squelette) : http://localhost:3002

Comptes **démo** (mots de passe dans `.env`, jamais des secrets réels) :

| Compte | E-mail | Mot de passe par défaut |
| --- | --- | --- |
| Admin Elhilal | `admin@elhilal.example` | `demo-elhilal-2026` |
| Super-admin Nizios | `admin@nizios.example` | `demo-nizios-2026` |

Le cookie de session est `httpOnly`. Il n'est marqué `Secure` que si `COOKIE_SECURE=true` (à réserver à HTTPS).

Pages, une fois l'API et le site lancés :

- Accueil : http://localhost:3000/fr et http://localhost:3000/ar
- Liste et fiche : http://localhost:3000/fr/biens et http://localhost:3000/fr/biens/ELH-AGD-01
- Admin biens et leads : http://localhost:3000/admin/biens et http://localhost:3000/admin/leads

Le formulaire de lead (nom, téléphone 06/07, achat ou location, budget, quartier, délai) enregistre un lead source « site », statut Nouveau, et notifie le WhatsApp de l'agence. Un champ invisible bloque les robots, et une même IP est limitée à 5 envois par 10 minutes. Le chat, en bas de page, suit le même message WhatsApp avec la source « chatbot ».

Vérifier :

```bash
pnpm build
pnpm lint
pnpm test
```

## Structure

```
apps/web          site public FR/AR, biens, formulaire, chat, admin biens
apps/api          API Nest : tenants, auth, biens, leads, chat, médias
apps/panel        panel interne Nizios, squelette
packages/db       Prisma, migrations, seed, lecture de clients/
packages/ui       composants Tailwind compatibles RTL
packages/i18n     chaînes d'interface FR/AR (pas le texte des agences)
packages/chatbot-flows   flux JSON du chatbot Darija / français
packages/config   tsconfig, eslint, preset Tailwind, résolution d'hôte
clients/<slug>    config, textes, photos et biens de démo — jamais de code
clients/_template modèle à copier
docs              checklist Google Maps
infra/docker      Postgres + api + web
infra/nginx       squelette
infra/scripts     squelette
```

## Dossier `clients/`

Un sous-dossier par client, nommé par le **slug**.

```
clients/elhilal/
  tenant.config.json       nom, domaines, langues, WhatsApp, branding, quartiers
  content/fr.json          textes français
  content/ar.json          textes arabes
  properties.json          biens de démo (optionnel)
  chatbot/flow.json        surcharge du flux de chat (optionnel)
  assets/                  logo et photos
  google-maps-checklist.md checklist remplie pour ce client
  README.md                statut et contacts
```

`clients/_template/` n'est jamais chargé en base. Les dossiers qui commencent par `_` non plus.

Le seed, `pnpm db:sync` et `POST /tenants` lisent la config et les textes. `pnpm db:seed` ajoute aussi les biens de `properties.json` **seulement si la référence n'existe pas** : une modification faite dans l'admin n'est pas écrasée. `pnpm db:sync` ne touche pas aux biens.

Le site affiche le nom, les textes et les quartiers renvoyés par l'API, pas une page codée pour Elhilal.

## Ajouter un tenant

1. `cp -R clients/_template clients/mon-agence`
2. Éditer `tenant.config.json` : le champ `slug` = le nom du dossier.
3. Remplir `content/fr.json`, `content/ar.json`, `assets/`, `google-maps-checklist.md` et le `README.md`.
4. Optionnel : `properties.json` (biens) et `chatbot/flow.json` (textes du chat).
5. `pnpm db:seed` (ou `pnpm db:sync` pour la fiche seulement, ou `POST /tenants` avec `{ "slug": "mon-agence" }` en super-admin).

Domaines :

- `mon-agence.localhost` et `mon-agence.nizarios.fr` sont reconnus par convention.
- Un domaine propre (`mon-agence.ma`) se déclare dans `domains`.
- `localhost` nu ne suit pas la convention : l'ajouter dans `domains` (Elhilal le fait pour le dev) et, si besoin, dans `TENANT_HOST_MAP`.

Aucun fichier `.ts` / `.js` n'est accepté dans `clients/`.

## Décisions techniques (à valider)

1. **Next.js 14.2 + React 18**, pas Next 15 : `headers()` et `params` restent synchrones, et React 18 est imposé.
2. **Isolation.** Chaque lecture métier passe par `requireTenantId` (un admin d'agence ne peut pas nommer un autre tenant). En plus, Postgres **FORCE ROW LEVEL SECURITY** sur `Property`, `PropertyPhoto` et `Lead`. `User` et `Tenant` ne sont pas sous RLS : la connexion cherche un e-mail, et la page publique cherche un domaine. Le rôle SQL de l'app ne doit pas être superuser, sinon le RLS ne s'applique pas. Le super-admin Nizios doit indiquer un tenant pour lire des biens ou des leads : pas d'accès global implicite.
3. **Les dossiers `clients/` sont la source de vérité.** La base est une copie (seed / sync). Le runtime du site lit l'API, pas le disque.
4. **Mots de passe démo** uniquement via `.env`. Ils ne sont pas dans `tenant.config.json`. Une synchro ne réécrit pas un mot de passe déjà posé.
5. **WhatsApp.** Le bouton visiteur est toujours un lien `wa.me` vers le numéro du tenant (message avec la référence du bien). La notification agence passe par l'API Cloud Meta si `WHATSAPP_CLOUD_TOKEN` et `WHATSAPP_CLOUD_PHONE_NUMBER_ID` sont remplis. Sinon l'API renvoie le même texte en lien `wa.me`. Aucun jeton réel dans le repo.
6. **Carte légère.** La page bien lie vers OpenStreetMap avec le centroïde du quartier. Pas de script Google Maps : la page reste légère (cible PageSpeed mobile ≥ 95, pas encore mesurée en labo).
7. **Chatbot.** Moteur à règles, flux JSON versionné dans `packages/chatbot-flows`. Un dossier `clients/<slug>/chatbot/flow.json` peut le surcharger. Darija (lettres arabes) par défaut ; français si le visiteur écrit en français. `sendChat` accepte un interpréteur optionnel pour brancher Gemini plus tard. Sessions et limite de débit en mémoire (un seul processus). Une seule relance, après 10 minutes sans réponse.
8. **Photos.** Les visuels de démo sont des SVG dans `clients/<slug>/assets/photos/`. L'upload admin est converti en WEBP (largeur max 1600, qualité 75) dans `uploads/` (gitignoré).
9. **Page publique.** Rendu serveur, police système. Le seul JavaScript de l'accueil est le bouton de chat ; le panneau se charge au clic.
10. Les policies RLS vivent dans la migration initiale. Un futur `prisma migrate` peut proposer de les supprimer : il faudra retirer ces `DROP POLICY` à la main.

## TODO

- Mini CRM : changer le statut, rappel, notes (les statuts sont en base, l'écran ne fait que les lister)
- Rapports, panel (liste des clients, clonage, abonnements)
- Nginx généré depuis les domaines
- Brancher Gemini sur le point d'extension `interpret` du chatbot
- Mesure PageSpeed réelle
- Sessions de chat et limite de débit partagées si plusieurs processus API
