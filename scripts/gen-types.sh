#!/usr/bin/env bash
# Generate TypeScript types from FastAPI's /openapi.json into packages/shared.
set -euo pipefail

API_URL="${API_URL:-http://localhost:8000}"
OUT="packages/shared/src/types.ts"

mkdir -p "$(dirname "$OUT")"

echo "Fetching OpenAPI from $API_URL/openapi.json"
pnpm exec openapi-typescript "$API_URL/openapi.json" -o "$OUT"
echo "Wrote $OUT"
