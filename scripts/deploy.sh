#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/var/www/hanly"
RELEASES_DIR="$APP_ROOT/releases"
CURRENT_LINK="$APP_ROOT/current"
ENV_FILE="/etc/hanly/hanly.env"
UPLOAD_ROOT="${UPLOAD_ROOT:-/var/lib/hanly/uploads}"
TARBALL="${1:-}"

if [[ -z "$TARBALL" || ! -f "$TARBALL" ]]; then
  echo "Usage: scripts/deploy.sh /path/to/release.tar.gz" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
NEW_RELEASE="$RELEASES_DIR/$STAMP"
mkdir -p "$NEW_RELEASE"
tar -xzf "$TARBALL" -C "$NEW_RELEASE"

test -f "$NEW_RELEASE/server.js"
test -d "$NEW_RELEASE/.next/static"
test -d "$NEW_RELEASE/prisma/migrations"

set -a
source "$ENV_FILE"
set +a

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${APP_ORIGIN:?APP_ORIGIN is required}"
: "${ADMIN_PASSWORD_HASH:?ADMIN_PASSWORD_HASH is required}"
: "${ADMIN_SESSION_SECRET:?ADMIN_SESSION_SECRET is required}"
: "${UPLOAD_ROOT:?UPLOAD_ROOT is required}"

(cd "$NEW_RELEASE" && node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.\$queryRaw\`SELECT 1\`.finally(()=>p.\$disconnect())")
(cd "$NEW_RELEASE" && ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma)

mkdir -p "$UPLOAD_ROOT/news"
test -w "$UPLOAD_ROOT"

OLD_CURRENT=""
if [[ -L "$CURRENT_LINK" ]]; then
  OLD_CURRENT="$(readlink -f "$CURRENT_LINK")"
fi

ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
pm2 startOrReload "$NEW_RELEASE/ecosystem.config.cjs"

if ! curl -fsS "http://127.0.0.1:${PORT:-3000}/api/health" >/dev/null; then
  echo "Health check failed, rolling back" >&2
  if [[ -n "$OLD_CURRENT" ]]; then
    ln -sfn "$OLD_CURRENT" "$CURRENT_LINK"
    pm2 startOrReload "$OLD_CURRENT/ecosystem.config.cjs" || true
  fi
  exit 1
fi

find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | while read -r dir; do
  resolved="$(readlink -f "$dir")"
  case "$resolved" in
    "$RELEASES_DIR"/*) rm -rf "$resolved" ;;
    *) echo "Refusing to remove unsafe path: $resolved" >&2; exit 1 ;;
  esac
done

pm2 save
echo "Deployed $NEW_RELEASE"
