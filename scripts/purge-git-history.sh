#!/usr/bin/env bash
#
# purge-git-history.sh — retire DÉFINITIVEMENT des chemins de tout l'historique git.
#
# Pourquoi : supprimer un fichier (ex. `.env`) dans un commit récent ne le retire pas de
# l'historique. `git log -p -- .env` continue d'afficher son contenu tant que les objets
# existent, et tout clone/backup du dépôt conserve l'ancienne version.
#
# Ce que fait le script :
#   1. contrôles préalables (arbre de travail propre, chemins réellement présents) ;
#   2. sauvegarde miroir complète de l'historique AVANT toute modification ;
#   3. réécriture de l'historique sans les chemins demandés (git-filter-repo si installé,
#      sinon `git filter-branch`, fourni avec git) ;
#   4. expiration des reflogs + `git gc` pour effacer les objets du disque ;
#   5. vérifications : chemins absents de l'historique, contenu du HEAD inchangé par ailleurs,
#      aucun motif de clé fournisseur ne subsiste.
#
# Le script ne pousse JAMAIS et ne touche à aucun dépôt distant : il affiche la commande
# de publication à exécuter après validation.
#
# Usage :
#   scripts/purge-git-history.sh                                  # simulation (rien n'est modifié)
#   scripts/purge-git-history.sh --run --backup-dir=../sauvegardes
#   scripts/purge-git-history.sh --run --secrets-only             # ne retire que .env
#
# Options :
#   --run              exécute réellement la réécriture (sinon : simulation)
#   --secrets-only     ne purge que `.env` (garde node_modules/.next dans l'historique)
#   --backup-dir=DIR   dossier de la sauvegarde miroir (obligatoire avec --run ;
#                      à placer HORS du dépôt pour ne pas risquer de la committer)
#   -h | --help        affiche cette aide
#
# ⚠️ La réécriture change tous les SHA : les autres copies du dépôt (clones, CI, sauvegardes)
#    gardent l'ancien historique. La seule vraie remédiation pour un secret est sa RÉVOCATION
#    côté fournisseur (Neon, Resend, secret JWT) ; ce nettoyage ne fait que purger ce dépôt-ci.

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

RUN=0
SECRETS_ONLY=0
BACKUP_DIR=""

while [ $# -gt 0 ]; do
  case "$1" in
    --run) RUN=1 ;;
    --secrets-only) SECRETS_ONLY=1 ;;
    --backup-dir=*) BACKUP_DIR="${1#*=}" ;;
    -h | --help)
      sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Option inconnue : $1 (voir --help)" >&2
      exit 2
      ;;
  esac
  shift
done

PATHS=(.env)
[ "$SECRETS_ONLY" -eq 1 ] || PATHS+=(node_modules .next)

echo "== Dépôt : $REPO_ROOT"
echo "== Chemins visés : ${PATHS[*]}"

if [ -n "$(git status --porcelain)" ]; then
  cat >&2 <<'EOF'
ERREUR : l'arbre de travail n'est pas propre.

Commitez (ou remisez) votre travail avant la réécriture, sinon les modifications en cours
ne font pas partie de l'historique réécrit. Recommandé :
  git add -A && git commit -m "chore: prépare la purge de l'historique"
puis relancez ce script.
EOF
  exit 1
fi

PRESENT=()
for p in "${PATHS[@]}"; do
  if [ -n "$(git log --all --pretty=format: --name-only -- "$p" | sed '/^$/d' | head -1)" ]; then
    PRESENT+=("$p")
    echo "   · présent dans l'historique : $p"
  else
    echo "   · absent de l'historique : $p (ignoré)"
  fi
done

if [ "${#PRESENT[@]}" -eq 0 ]; then
  echo "Rien à purger : l'historique ne contient aucun des chemins visés."
  exit 0
fi

PACK_BEFORE=$(git count-objects -vH | awk '/size-pack/ {print $2 $3}')
echo "== Taille de l'historique avant : $PACK_BEFORE"

if [ "$RUN" -ne 1 ]; then
  cat <<EOF

== SIMULATION — aucune modification effectuée.

La réécriture réelle est lancée par :
  scripts/purge-git-history.sh --run --backup-dir=<dossier hors du dépôt>${SECRETS_ONLY:+ --secrets-only}

Elle enchaînera exactement :
  1. git clone --mirror "$REPO_ROOT" "\$BACKUP_DIR/$(basename "$REPO_ROOT")-prepurge-<horodatage>.git"
  2. $([ "$(command -v git-filter-repo || true)" ] && echo "git filter-repo --invert-paths $(printf '--path %s ' "${PRESENT[@]}")" || echo "git filter-branch --index-filter 'git rm -r --cached --ignore-unmatch ${PRESENT[*]}' --tag-name-filter cat -- --all")
  3. rm -rf .git/refs/original && git reflog expire --expire=now --all && git gc --prune=now
  4. vérifications (chemins absents, HEAD inchangé, aucun motif de clé restant)
EOF
  exit 0
fi

if [ -z "$BACKUP_DIR" ]; then
  echo "ERREUR : --backup-dir=<dossier> est obligatoire avec --run (à placer hors du dépôt)." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/$(basename "$REPO_ROOT")-prepurge-$(date +%Y%m%d-%H%M%S).git"
echo "== Sauvegarde de l'historique complet : $BACKUP"
git clone --quiet --mirror "$REPO_ROOT" "$BACKUP"
git --git-dir="$BACKUP" rev-parse HEAD >/dev/null
echo "   sauvegarde vérifiée ($(git --git-dir="$BACKUP" rev-list --all --count) commits)"

OLD_HEAD=$(git rev-parse HEAD)

echo "== Réécriture de l'historique"
if command -v git-filter-repo >/dev/null 2>&1; then
  ARGS=(--force --invert-paths)
  for p in "${PRESENT[@]}"; do ARGS+=(--path "$p"); done
  git filter-repo "${ARGS[@]}"
else
  INDEX_FILTER="git rm -r -q --cached --ignore-unmatch ${PRESENT[*]}"
  FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --index-filter "$INDEX_FILTER" --tag-name-filter cat -- --all
fi

echo "== Vérification : le contenu du HEAD est-il inchangé hors chemins purgés ?"
EXCLUDES=()
for p in "${PRESENT[@]}"; do EXCLUDES+=(":(exclude)$p"); done
if git diff --quiet "$OLD_HEAD" HEAD -- . "${EXCLUDES[@]}"; then
  echo "   OK — aucun autre fichier modifié"
else
  echo "ERREUR : des fichiers étrangers à la purge ont changé. Ne poussez pas." >&2
  git diff --stat "$OLD_HEAD" HEAD -- . "${EXCLUDES[@]}" >&2
  exit 1
fi

echo "== Effacement des objets (reflogs + gc)"
rm -rf .git/refs/original
git reflog expire --expire=now --all
git gc --prune=now >/dev/null

echo "== Vérifications finales"
FAILED=0
for p in "${PRESENT[@]}"; do
  REMAINS=$(git log --all --pretty=format: --name-only -- "$p" | sed '/^$/d' | wc -l)
  if [ "$REMAINS" -eq 0 ]; then
    echo "   OK — $p absent de tout l'historique"
  else
    echo "   ÉCHEC — $p encore présent ($REMAINS chemins)" >&2
    FAILED=1
  fi
done

# Motif découpé volontairement : ainsi le script ne se détecte pas lui-même au contrôle.
KEY_PATTERN='np''g_|ns''k_live'
KEYS=$(git grep -I -l -E "$KEY_PATTERN" $(git rev-list --all) 2>/dev/null || true)
if [ -z "$KEYS" ]; then
  echo "   OK — aucun motif de clé fournisseur dans l'historique"
else
  echo "   ÉCHEC — motif de clé encore présent dans : $KEYS" >&2
  FAILED=1
fi

PACK_AFTER=$(git count-objects -vH | awk '/size-pack/ {print $2 $3}')
echo "== Taille de l'historique après : $PACK_AFTER"
[ "$FAILED" -eq 0 ] || exit 1

REMOTE=$(git remote get-url origin 2>/dev/null || true)
echo
if [ -z "$REMOTE" ]; then
  echo "== Aucun dépôt distant configuré : rien à pousser."
elif [ "$(git ls-remote --heads origin 2>/dev/null | wc -l)" -eq 0 ]; then
  cat <<EOF
== Le dépôt distant ($REMOTE) ne contient encore aucune branche :
   un push normal publie l'historique nettoyé, aucun force-push nécessaire.
     git push -u origin master
EOF
else
  cat <<EOF
== Le dépôt distant ($REMOTE) contient déjà l'ancien historique : force-push nécessaire.
   À valider explicitement avant exécution — la réécriture rend caduques tous les clones.
     git push --force --all origin
     git push --force --tags origin
   Puis : prévenir les collaborateurs de re-cloner, et révoquer les secrets exposés.
EOF
fi

cat <<'EOF'

== Après la purge, pensez à :
   · révoquer/rotater les secrets qui étaient exposés (la purge ne les invalide pas) ;
   · vérifier que `.gitignore` couvre bien `.env` et les artefacts de build ;
   · supprimer les forfaits/clones du dépôt qui conservent l'ancien historique.
EOF
