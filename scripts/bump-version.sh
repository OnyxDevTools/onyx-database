# filename: scripts/bump-version.sh
#!/usr/bin/env bash
# Interactive one-step bump + publish trigger.
# Prompts you for bump type and message, then:
#   - creates a changeset
#   - installs deps + runs tests (fail fast before any commits)
#   - enforces 100% coverage (per project threshold) before continuing
#   - applies version bump
#   - commits & pushes to main
#   - tags and pushes the tag
# CI workflow will handle the actual publish.

set -euo pipefail

abort() { echo "ERROR: $*" >&2; exit 1; }
info()  { echo "==> $*"; }
cmd()   { echo "+ $*"; "$@"; }

# --- Repo checks ---
[[ -f "package.json" ]] || abort "Run from the repo root (package.json not found)."

PKG_NAME="$(node -e "console.log(require('./package.json').name || '')" 2>/dev/null || true)"
[[ -n "$PKG_NAME" ]] || abort "Could not read package name from package.json."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
MAIN_BRANCH="main"

# --- Ensure on main before committing ---
if [[ "${CURRENT_BRANCH}" != "${MAIN_BRANCH}" ]]; then
  info "Switching to ${MAIN_BRANCH}..."
  cmd git checkout "${MAIN_BRANCH}"
fi

# --- Install & test before committing ---
info "Installing deps..."
cmd npm install

info "Running tests (enforces coverage thresholds)..."
# Vitest config requires 100% coverage; this will fail the script if unmet.
cmd npm test

info "Running smoke test (phase gate)..."
cmd npm test -- tests/smoke.spec.ts

info "Linting..."
cmd npm run lint

info "Building..."
cmd npm run build

info "Packaging dry-run (ensures publishability)..."
cmd npm pack --dry-run >/dev/null

info "Running examples (phase gate)..."
if ! ./scripts/run-examples.sh; then
  abort "Examples failed; fix before version bump."
fi

# --- Ensure clean working tree before creating changeset/version bump ---
if ! git diff --quiet || ! git diff --cached --quiet; then
  abort "Working tree not clean. Commit or stash changes first."
fi

# --- Prompt for bump type ---
echo "Select version bump type:"
select BUMP_TYPE in patch minor major; do
  [[ -n "${BUMP_TYPE}" ]] && break
done

# --- Prompt for message ---
read -rp "Enter a changeset message (short description of the change): " MESSAGE
MESSAGE="${MESSAGE:-"${BUMP_TYPE} release"}"

# --- Create changeset file ---
mkdir -p .changeset
STAMP="$(date +%Y%m%d-%H%M%S)"
SAFE_MSG="$(echo "${MESSAGE}" | tr '[:space:]' '-' | tr -cd '[:alnum:]-' | tr '[:upper:]' '[:lower:]')"
CHANGESET_FILE=".changeset/${STAMP}-${SAFE_MSG}.md"

cat > "${CHANGESET_FILE}" <<EOF
---
"${PKG_NAME}": ${BUMP_TYPE}
---

${MESSAGE}
EOF

info "Created changeset: ${CHANGESET_FILE}"

# --- Commit changeset to main ---
info "Adding changeset..."
cmd git add "${CHANGESET_FILE}"
cmd git commit -m "chore: changeset (${BUMP_TYPE}): ${MESSAGE}"
cmd git push origin "${MAIN_BRANCH}"

# --- Apply version bump ---
info "Applying changeset version bump..."
cmd npx changeset version

if git diff --quiet; then
  abort "No version changes produced; nothing to publish."
fi

info "Committing version changes..."
cmd git add -A
cmd git commit -m "chore: version packages"
cmd git push origin "${MAIN_BRANCH}"

# --- Tag + push ---
NEW_VERSION="$(node -p "require('./package.json').version")"
[[ -n "${NEW_VERSION}" ]] || abort "Unable to read version from package.json."
TAG="v${NEW_VERSION}"

info "Creating tag ${TAG}..."
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  info "Tag ${TAG} already exists locally; re-pointing to current HEAD."
  git tag -d "${TAG}" >/dev/null 2>&1 || true
fi
cmd git tag -a "${TAG}" -m "${TAG}"
cmd git push origin "${TAG}"

cat <<NOTE

Done.

- Bump type: ${BUMP_TYPE}
- Message:   ${MESSAGE}
- Version:   ${NEW_VERSION}
- Tag:       ${TAG}

Your Release workflow will now publish on tag ${TAG}.
Check GitHub → Actions → Release.

NOTE
