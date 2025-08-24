#!/usr/bin/env bash
# filename: scripts/bootstrap.sh
# Idempotent bootstrap for the Onyx Database repo.
# - Installs root deps
# - Builds the library + CLI
# - Installs example deps (creates local bin shim)
# - Generates TS types from examples/onyx.schema.json into examples/onyx/types.ts
#
# Safe to run multiple times.

set -euo pipefail

#------------------------------- helpers ---------------------------------------
log() { printf " • %s\n" "$*"; }
warn() { printf " ! %s\n" "$*" >&2; }
die() { printf " ✖ %s\n" "$*" >&2; exit 1; }
run() { printf " $ %s\n" "$*"; "$@"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

node_major() {
  node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0"
}

#------------------------------- resolve paths ---------------------------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
EXAMPLES_DIR="${REPO_ROOT}/examples"
SCHEMA_FILE="${EXAMPLES_DIR}/onyx.schema.json"
GENERATED_TS_FILE="${EXAMPLES_DIR}/onyx/types.ts"
EXAMPLES_BIN="${EXAMPLES_DIR}/node_modules/.bin"

#------------------------------- preflight -------------------------------------
require_cmd node
require_cmd npm

if [[ "$(node_major)" -lt 18 ]]; then
  die "Node.js >= 18 is required (found $(node -v))"
fi

[[ -d "${REPO_ROOT}" ]]    || die "Repo root not found at ${REPO_ROOT}"
[[ -d "${EXAMPLES_DIR}" ]] || die "Examples folder not found at ${EXAMPLES_DIR}"
[[ -f "${SCHEMA_FILE}" ]]  || die "Missing schema file: ${SCHEMA_FILE}
Create it (or copy your schema) before running bootstrap."

#------------------------------- step 1: root deps -----------------------------
log "Installing root dependencies (@onyx.dev/onyx-database)…"
(
  cd "${REPO_ROOT}"
  run npm install
)

#------------------------------- step 2: build lib -----------------------------
log "Building library and CLI (dist/)…"
(
  cd "${REPO_ROOT}"
  run npm run build
)

#------------------------------- step 3: examples deps -------------------------
log "Ensuring examples dependencies (links local package via file:..)…"
(
  cd "${EXAMPLES_DIR}"
  # Install if node_modules missing or onyx-gen shim absent
  if [[ ! -d "node_modules" || ! -x "${EXAMPLES_BIN}/onyx-gen" ]]; then
    run npm install
  else
    log "examples/node_modules present; skipping npm install"
  fi
)

#------------------------------- step 4: codegen -------------------------------
log "Generating TypeScript types from ${SCHEMA_FILE} → ${GENERATED_TS_FILE}…"
(
  cd "${EXAMPLES_DIR}"
  # Run the examples script which calls local onyx-gen.
  run npm run -s gen:onyx
)

# Verify output exists
if [[ ! -f "${GENERATED_TS_FILE}" ]]; then
  die "Expected generated file not found: ${GENERATED_TS_FILE}"
fi

log "Bootstrap complete ✅"
printf "\nNext steps:\n"
printf "  cd examples && npm start   # run the current example (tsx)\n"
