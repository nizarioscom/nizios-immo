# Nginx

Squelette. Pas de configuration active au Jour 1.

Plus tard, un vhost par domaine déclaré dans `clients/<slug>/tenant.config.json` enverra le trafic vers `apps/web`. Aucun `server_name` spécifique à un client ne doit être codé en dur dans le dépôt : la liste viendra de la config des tenants.

Exemple commenté : `nizios.conf.example`.
