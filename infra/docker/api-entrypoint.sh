#!/bin/sh
set -e
cd /app
pnpm --filter @nizios/db exec prisma migrate deploy
pnpm --filter @nizios/db exec tsx prisma/seed.ts
node apps/api/dist/main.js
