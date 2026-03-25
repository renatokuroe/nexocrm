#!/bin/sh
set -eu

# Preserve previously deployed Next static chunks while adding the current build.
mkdir -p /app/.next/static
cp -R /opt/next-static/. /app/.next/static/ || true

exec npm run start
