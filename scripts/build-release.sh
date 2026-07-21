#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
ARCH="$(node -p "process.arch")"
PLATFORM="$(node -p "process.platform")"

if [[ "$PLATFORM" != "linux" ]]; then
  echo "ERROR: release must be built in WSL/Linux, current platform is $PLATFORM" >&2
  exit 1
fi

if [[ "${PRODUCTION_NODE_MAJOR:-$NODE_MAJOR}" != "$NODE_MAJOR" ]]; then
  echo "ERROR: Node major mismatch. Build=$NODE_MAJOR Production=${PRODUCTION_NODE_MAJOR}" >&2
  exit 1
fi

if [[ -n "${PRODUCTION_ARCH:-}" && "$PRODUCTION_ARCH" != "$ARCH" ]]; then
  echo "ERROR: architecture mismatch. Build=$ARCH Production=${PRODUCTION_ARCH}" >&2
  exit 1
fi

rm -rf .next release release-*.tar.gz
npm run lint
npm run typecheck
npm run test
npm run prisma:generate
npm run build

test -f .next/standalone/server.js
test -d .next/static
test -d prisma/migrations

mkdir -p release/.next
cp -a .next/standalone/. release/
cp -a .next/static release/.next/static
cp -a public release/public
mkdir -p release/prisma
cp -a prisma/schema.prisma release/prisma/schema.prisma
cp -a prisma/migrations release/prisma/migrations
cp package.json package-lock.json ecosystem.config.cjs release/
mkdir -p release/node_modules/.bin
cp -a node_modules/prisma release/node_modules/prisma
cp -a node_modules/@prisma release/node_modules/@prisma
cp -a node_modules/.prisma release/node_modules/.prisma
cp -a node_modules/.bin/prisma* release/node_modules/.bin/

test -x release/node_modules/.bin/prisma || test -f release/node_modules/.bin/prisma

if [[ -e release/.env || -e release/out ]]; then
  echo "ERROR: release contains forbidden files" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
TARBALL="release-${STAMP}.tar.gz"
tar -czf "$TARBALL" -C release .
tar -tzf "$TARBALL" | sort
echo "Created $TARBALL"
