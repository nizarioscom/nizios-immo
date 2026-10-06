-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'AGENCY_ADMIN');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'RENT');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('SITE', 'WHATSAPP', 'CALL', 'MESSENGER');

-- CreateEnum
CREATE TYPE "LeadIntent" AS ENUM ('BUY', 'RENT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'CALLED', 'VISIT', 'DEAL', 'LOST');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domains" TEXT[],
    "defaultLocale" TEXT NOT NULL DEFAULT 'fr',
    "locales" TEXT[] DEFAULT ARRAY['fr', 'ar']::TEXT[],
    "branding" JSONB NOT NULL,
    "whatsappNumbers" TEXT[],
    "config" JSONB NOT NULL DEFAULT '{}',
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "tenantId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "priceMad" INTEGER,
    "neighborhood" TEXT,
    "transaction" "TransactionType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPhoto" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "source" "LeadSource" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "intent" "LeadIntent",
    "budgetMad" INTEGER,
    "neighborhood" TEXT,
    "timeline" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "reminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "Property_tenantId_idx" ON "Property"("tenantId");

-- CreateIndex
CREATE INDEX "Property_tenantId_status_idx" ON "Property"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Property_id_tenantId_key" ON "Property"("id", "tenantId");

-- CreateIndex
CREATE INDEX "PropertyPhoto_tenantId_idx" ON "PropertyPhoto"("tenantId");

-- CreateIndex
CREATE INDEX "PropertyPhoto_propertyId_idx" ON "PropertyPhoto"("propertyId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPhoto" ADD CONSTRAINT "PropertyPhoto_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "Property"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Super-admin sans tenant, admin d'agence obligatoirement rattaché.
ALTER TABLE "User" ADD CONSTRAINT "User_role_tenant_check" CHECK (
  ("role"::text = 'SUPER_ADMIN' AND "tenantId" IS NULL)
  OR
  ("role"::text = 'AGENCY_ADMIN' AND "tenantId" IS NOT NULL)
);

-- Isolation Postgres des données métier.
-- User et Tenant restent sans RLS (login par e-mail, résolution par domaine).
-- Le rôle applicatif ne doit pas être superuser : FORCE ne s'applique pas aux superusers.
CREATE OR REPLACE FUNCTION app_tenant_visible(row_tenant uuid) RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    current_setting('app.bypass_rls', true) = 'on'
    OR (
      current_setting('app.tenant_id', true) <> ''
      AND row_tenant::text = current_setting('app.tenant_id', true)
    );
$$;

ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Property"
  USING (app_tenant_visible("tenantId"))
  WITH CHECK (app_tenant_visible("tenantId"));

ALTER TABLE "PropertyPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyPhoto" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "PropertyPhoto"
  USING (app_tenant_visible("tenantId"))
  WITH CHECK (app_tenant_visible("tenantId"));

ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Lead"
  USING (app_tenant_visible("tenantId"))
  WITH CHECK (app_tenant_visible("tenantId"));
