-- Hero de la page d'accueil pilotable depuis l'administration.
-- Les valeurs par défaut reproduisent exactement le contenu affiché jusqu'ici :
-- appliquer la migration ne change donc pas le rendu du site.
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroBadge" TEXT NOT NULL DEFAULT 'Bois sec étuvé certifié NF H1 · Taux d''humidité inférieur à 20%';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroTitle" TEXT NOT NULL DEFAULT 'Bois de chauffage haute performance livré sur palette à domicile';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT NOT NULL DEFAULT 'Approvisionnement direct en palettes de bois dur (chêne, charme, hêtre) séché en étuve biomasse. Allumage immédiat, haut pouvoir calorifique garanti et livraison par camion avec hayon et transpalette.';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroPrimaryLabel" TEXT NOT NULL DEFAULT 'Consulter le catalogue';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroPrimaryHref" TEXT NOT NULL DEFAULT '/boutique';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroSecondaryLabel" TEXT NOT NULL DEFAULT 'Calculer les frais de port';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroSecondaryHref" TEXT NOT NULL DEFAULT '/calculateurs/livraison';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT NOT NULL DEFAULT '/images/hero.webp';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroImageCaption" TEXT NOT NULL DEFAULT 'Palettes filmées & cerclées';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroImageCaptionSub" TEXT NOT NULL DEFAULT 'Bûches 25 cm, 33 cm et 50 cm disponibles';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroImageBadge" TEXT NOT NULL DEFAULT 'Stock disponible';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroFact1Value" TEXT NOT NULL DEFAULT '2 000 kWh';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroFact1Label" TEXT NOT NULL DEFAULT 'Énergie par stère';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroFact2Value" TEXT NOT NULL DEFAULT '< 20%';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroFact2Label" TEXT NOT NULL DEFAULT 'Humidité contrôlée';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroFact3Value" TEXT NOT NULL DEFAULT 'Hayon inclus';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "heroFact3Label" TEXT NOT NULL DEFAULT 'Dépose à votre abri';
