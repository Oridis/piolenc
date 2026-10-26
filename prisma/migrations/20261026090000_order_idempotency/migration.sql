-- Idempotence de la validation de commande.
-- Un même tunnel de commande (double clic, actualisation, retour navigateur) ne
-- doit pas créer deux commandes : le client envoie une clé stable par tentative
-- et le serveur renvoie la commande existante si la clé a déjà été utilisée.
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
