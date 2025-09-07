# filename: scripts/patch.sh
#!/usr/bin/env bash
# Create a non-interactive PATCH changeset for the current package and push a release branch.
# Usage: ./scripts/patch.sh

set -euo pipefail

# --- Ask for message ---
read -rp "Enter a changeset message (short description of the change): " MSG
MSG=${MSG:-"patch release"}

# --- What is the message for? ---
# The message becomes the human-readable description in the changeset markdown file.
# It shows up in the GitHub Release notes and changelog that Changesets generates.

# Ensure we're at the repo root
if [[ ! -f "package.json" ]]; then
  echo "Error: package.json not found. Run this from the repository root." >&2
  exit 1
fi

# Resolve package name from package.json
PKG_NAME="$(node -e "console.log(require('./package.json').name || '')" 2>/dev/null || true)"
if [[ -z "${PKG_NAME}" ]]; then
  echo "Error: could not determine package name from package.json." >&2
  exit 1
fi

# Ensure .changeset exists
mkdir -p .changeset

# Generate a unique changeset filename
STAMP="$(date +%Y%m%d-%H%M%S)"
SAFE_MSG="$(echo "${MSG}" | tr '[:space:]' '-' | tr -cd '[:alnum:]-' | tr '[:upper:]' '[:lower:]')"
CHANGESET_FILE=".changeset/${STAMP}-${SAFE_MSG:-patch}.md"

# Write the changeset (PATCH bump)
cat > "${CHANGESET_FILE}" <<EOF
---
"${PKG_NAME}": patch
---

${MSG}
EOF

echo "Created changeset: ${CHANGESET_FILE}"
echo

# Create and push a release branch
BRANCH="release/patch-${STAMP}"
git checkout -b "${BRANCH}"
git add "${CHANGESET_FILE}"
git commit -m "chore: changeset (patch): ${MSG}"
git push -u origin "${BRANCH}"

cat <<NOTE

Done.
- Branch: ${BRANCH}
- Changeset: ${CHANGESET_FILE}

Next:
- GitHub Actions will open/update a **Version PR** from this branch.
- That PR bumps the version & changelog.
- Merging the PR creates a tag → triggers the publish workflow → publishes to npm.
NOTE
