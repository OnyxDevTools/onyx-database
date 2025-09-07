# filename: scripts/version-and-tag.sh
#!/usr/bin/env bash
# Bumps version from pending Changesets, commits, pushes to main, tags, and pushes the tag.
# This triggers the GitHub Actions publish job (your workflow publishes on tags v*).

set -euo pipefail

# --- Helpers ---
abort() { echo "ERROR: $*" >&2; exit 1; }
info()  { echo "==> $*"; }

# --- Preconditions ---
# Ensure we're at repo root
[[ -f "package.json" ]] || abort "Run from the repository root (package.json not found)."

# Ensure clean working tree
if ! git diff --quiet || ! git diff --cached --quiet; then
  abort "Working tree not clean. Commit or stash changes first."
fi

# Ensure there is at least one pending changeset
PENDING_CHANGESETS="$(ls .changeset/*.md 2>/dev/null | wc -l | tr -d ' ')"
if [[ "${PENDING_CHANGESETS}" -eq 0 ]]; then
  abort "No pending changesets found in .changeset/*.md.
Create one first (e.g., ./scripts/patch.sh) and push it."
fi

# --- Sync main ---
info "Checking out main & syncing with origin..."
git checkout main
git fetch origin --tags
git pull --ff-only origin main

# --- Install & build (validates build before versioning) ---
info "Installing deps..."
npm ci
info "Building..."
npm run build

# --- Apply version bump from Changesets ---
info "Applying changeset version bump..."
npx changeset version

# --- Commit version files ---
if git diff --quiet; then
  abort "No version changes produced. (Did Changesets fail or nothing to version?)"
fi

info "Committing version changes..."
git add -A
git commit -m "chore: version packages"
info "Pushing to origin/main..."
git push origin main

# --- Determine new version & tag ---
VERSION="$(node -p "require('./package.json').version")"
[[ -n "${VERSION}" ]] || abort "Unable to read version from package.json."

TAG="v${VERSION}"
info "Creating tag ${TAG}..."
# If tag exists locally, delete and recreate to match latest commit
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  info "Tag ${TAG} already exists locally; re-pointing to current HEAD."
  git tag -d "${TAG}" >/dev/null 2>&1 || true
fi
git tag -a "${TAG}" -m "${TAG}"

info "Pushing tag ${TAG} to origin..."
git push origin "${TAG}"

cat <<DONE

All set.

- Version bump committed to main.
- Tag ${TAG} pushed.
- GitHub Actions "Release" workflow should now run the publish job for ${TAG}.

Next:
- Watch Actions → Release for the publish run.
- After success, install with:  npm i @onyx.dev/onyx-database@latest

DONE
