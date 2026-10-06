-- Biens bilingues, leads du site et du chatbot.
-- Les policies RLS existantes couvrent déjà Property et Lead : pas de nouvelle policy.

ALTER TYPE "LeadSource" ADD VALUE 'CHATBOT';

ALTER TABLE "Property" ADD COLUMN "reference" TEXT;
UPDATE "Property" SET "reference" = "id"::text WHERE "reference" IS NULL;
ALTER TABLE "Property" ALTER COLUMN "reference" SET NOT NULL;

ALTER TABLE "Property" ADD COLUMN "titleAr" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Property" ADD COLUMN "descriptionAr" TEXT;
ALTER TABLE "Property" ADD COLUMN "bedrooms" INTEGER;
ALTER TABLE "Property" ADD COLUMN "bathrooms" INTEGER;
ALTER TABLE "Property" ADD COLUMN "surfaceM2" INTEGER;
ALTER TABLE "Property" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN "longitude" DOUBLE PRECISION;

CREATE UNIQUE INDEX "Property_tenantId_reference_key" ON "Property"("tenantId", "reference");

ALTER TABLE "Lead" ADD COLUMN "budgetLabel" TEXT;
ALTER TABLE "Lead" ADD COLUMN "propertyId" UUID;

CREATE INDEX "Lead_propertyId_idx" ON "Lead"("propertyId");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
