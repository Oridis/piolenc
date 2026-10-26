-- Nom du site affiché séparément dans l'en-tête et dans le pied de page.
--
-- L'exploitant peut vouloir ne garder que le logo image en haut et le texte
-- seul en bas (ou l'inverse). La colonne existante "showSiteName" pilote
-- désormais l'en-tête uniquement ; cette nouvelle colonne pilote le pied de
-- page et reprend la valeur déjà enregistrée, afin que rien ne change à
-- l'écran au moment de la migration.
--
-- Bloc idempotent : la colonne n'est créée (et la reprise n'a lieu) que si
-- elle n'existe pas encore, pour ne jamais écraser un choix fait depuis
-- l'administration lors d'une réexécution.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SiteSetting' AND column_name = 'showSiteNameFooter'
  ) THEN
    ALTER TABLE "SiteSetting" ADD COLUMN "showSiteNameFooter" BOOLEAN NOT NULL DEFAULT true;
    UPDATE "SiteSetting" SET "showSiteNameFooter" = "showSiteName";
  END IF;
END $$;
