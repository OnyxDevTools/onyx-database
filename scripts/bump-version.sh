# filename: scripts/bump-version.sh
#!/usr/bin/env bash
# One-step version + publish trigger for @onyx.dev/onyx-database.
# Creates a changeset, applies the version bump, pushes to main, tags, and pushes the tag.
# By default it performs the entire flow locally (no PR) and relies on your CI to publish on tag.
#
# Optional: --pr mode
#   If you pass --pr, the script will:
#     - create a release/* branch
#     - commit the changeset there
#     - open a PR with gh
#     - attempt to merge it
#     - pull main and continue with version+tag
#
# Requirements:
#   - git, node, npm
#   - changesets installed (dev dependency is fine): npx changeset ...
#   - (for --pr) GitHub CLI `gh` authenticated with permission to create/merge PRs
#
# Usage:
#   ./scripts/bump-version.sh                # patch bump (default), prompt for message
#   ./scripts/bump-version.sh --type minor   # choose bump type
#   ./scripts/bump-version.sh --type major --message "breaking: xyz"
#   ./scripts/bump-version.sh --pr           # use PR flow (requires `gh`)
#
set -euo pipefail

abort() { echo "ERROR: $*" >&2; exit 1; }
info()  { echo "==> $*"; }
cmd()   { echo "+ $*"; eval "$@"; }

# --- Parse args ---
BUMP_TYPE="patch"
MESSAGE=""
USE_PR="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type)
      [[ $# -ge 2 ]] || abort "--type requires one of: patch|minor|major"
      BUMP_TYPE="$2"; shift 2;;
    --message|-m)
      [[ $# -ge 2 ]] || abort "--message requires a string"
      MESSAGE="$2"; shift 2;;
    --pr)
      USE_PR="1"; shift;;
    *)
      abort "Unknown arg: $1"
      ;;
  esac
done

case "$BUMP_TYPE" in
  patch|minor|major) ;;
  *) abort "--type must be one of: patch|minor|major";;
esac

# --- Repo checks ---
[[ -f "package.json" ]] || abort "Run from the repository root (package.json not found)."
if ! git diff --quiet || ! git diff --cached --quiet; then
  abort "Working tree not clean. Commit or stash changes first."
fi

PKG_NAME="$(node -e "console.log(require('./package.json').name || '')" 2>/dev/null || true)"
[[ -n "$PKG_NAME" ]] || abort "Could not read package name from package.json."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
MAIN_BRANCH="main"

# --- Ask for message if missing ---
if [[ -z "${MESSAGE}" ]]; then
  read -rp "Enter a changeset message (short description of the change): " MESSAGE
  MESSAGE="${MESSAGE:-"${BUMP_TYPE} release"}"
fi

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

if [[ "${USE_PR}" == "1" ]]; then
  # --- PR Flow: create branch, push, open PR, merge ---
  command -v gh >/dev/null 2>&1 || abort "gh (GitHub CLI) is required for --pr mode."
  RELEASE_BRANCH="release/${BUMP_TYPE}-${STAMP}"

  info "Creating branch: ${RELEASE_BRANCH}"
  cmd git checkout -b "${RELEASE_BRANCH}"
  cmd git add "${CHANGESET_FILE}"
  cmd git commit -m "chore: changeset (${BUMP_TYPE}): ${MESSAGE}"
  cmd git push -u origin "${RELEASE_BRANCH}"

  info "Opening PR to ${MAIN_BRANCH}..."
  PR_URL="$(gh pr create --fill --base "${MAIN_BRANCH}" --head "${RELEASE_BRANCH}")" || abort "Failed to open PR"
  echo "PR: ${PR_URL}"

  info "Attempting to merge PR..."
  # Use --merge strategy; adjust to --squash if your repo requires it.
  gh pr merge --merge --admin --delete-branch || abort "PR merge failed; complete it in the UI and rerun from here"

  info "Syncing ${MAIN_BRANCH}..."
  cmd git checkout "${MAIN_BRANCH}"
  cmd git pull --ff-only
else
  # --- Direct mode: keep everything on main locally ---
  if [[ "${CURRENT_BRANCH}" != "${MAIN_BRANCH}" ]]; then
    info "Switching to ${MAIN_BRANCH}..."
    cmd git checkout "${MAIN_BRANCH}"
  fi
  info "Adding changeset on ${MAIN_BRANCH}..."
  cmd git add "${CHANGESET_FILE}"
  cmd git commit -m "chore: changeset (${BUMP_TYPE}): ${MESSAGE}"
  cmd git push origin "${MAIN_BRANCH}"
fi

# --- Install & build before versioning (sanity) ---
info "Installing deps..."
cmd npm ci
info "Building..."
cmd npm run build

# --- Apply version bump from Changesets ---
info "Applying changeset version bump..."
cmd npx changeset version

# --- Commit version files & push ---
if git diff --quiet; then
  abort "No version changes produced; nothing to publish."
fi

info "Committing version changes..."
cmd git add -A
cmd git commit -m "chore: version packages"
cmd git push origin "${MAIN_BRANCH}"

# --- Tag & push tag (triggers CI publish) ---
NEW_VERSION="$(node -p "require('./package.json').version")"
[[ -n "${NEW_VERSION}" ]] || abort "Unable to read version from package.json."
TAG="v${NEW_VERSION}"

info "Creating tag ${TAG}..."
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  info "Tag ${TAG} already exists locally; re-pointing to current HEAD."
  git tag -d "${TAG}" >/dev/null 2>&1 || true
fi
cmd git tag -a "${TAG}" -m "${TAG}"
info "Pushing tag ${TAG}..."
cmd git push origin "${TAG}"

cat <<NOTE

Done.

- Bump type: ${BUMP_TYPE}
- Message:   ${MESSAGE}
- Version:   ${NEW_VERSION}
- Tag:       ${TAG}

Your Release workflow will now publish on tag ${TAG}.
Watch GitHub → Actions → Release.

NOTE
