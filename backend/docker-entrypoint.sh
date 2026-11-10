#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Starting KfuPet backend..."
exec node dist/main.js
