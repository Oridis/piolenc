-- Identité visuelle de l'en-tête et du pied de page.
-- Quand un logo est défini, l'exploitant doit pouvoir choisir si le nom du
-- site (renseigné dans l'admin) reste affiché à côté du logo.
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "showSiteName" BOOLEAN NOT NULL DEFAULT true;
