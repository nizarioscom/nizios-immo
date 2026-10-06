# Docker de développement

Postgres 16, l'API Nest et le site Next. Le panel n'est pas dans Compose au Jour 1.

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up --build
```

L'API applique les migrations puis relit `clients/` au démarrage.

Le rôle Postgres `nizios` n'est pas superuser : le row-level security s'applique.
