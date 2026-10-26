-- Traçabilité des envois transactionnels.
-- Chaque envoi accepté par le fournisseur (Resend) renvoie un identifiant de
-- message : le conserver permet de retrouver précisément l'e-mail dans le
-- tableau de bord du fournisseur, puis d'en suivre le statut (livré, rejeté).
ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;
