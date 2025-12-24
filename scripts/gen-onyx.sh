#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/gen-onyx.sh [schemaPath] [outPaths]
# - schemaPath defaults to the repo's ./onyx.schema.json
# - outPaths defaults to ./onyx/types.ts (comma-separated list supported)

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_SCHEMA_PATH="${REPO_ROOT}/onyx.schema.json"
SCHEMA_PATH="${1:-${DEFAULT_SCHEMA_PATH}}"
OUT_PATHS="${2:-${OUT_FILES:-./onyx-ui/types.ts,./onyx-api/types.ts}}"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to install onyx-gen" >&2
  exit 1
fi

echo "Installing @onyx.dev/onyx-database globally (provides onyx-gen CLI)..."
npm install -g @onyx.dev/onyx-database

echo "Generating types from schema at '${SCHEMA_PATH}' into '${OUT_PATHS}'..."
onyx-gen --source file --schema "$SCHEMA_PATH" --out "$OUT_PATHS"

echo "Done. Generated types at ${OUT_PATHS}"
