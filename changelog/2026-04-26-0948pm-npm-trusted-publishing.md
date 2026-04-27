# Change: switch npm release workflow to trusted publishing

- Date: 2026-04-26 09:48 PM PT
- Author/Agent: Codex (GPT-5)
- Scope: tooling
- Type: chore
- Summary:
  - remove `NODE_AUTH_TOKEN`-based npm publish from the release workflow and publish via GitHub Actions OIDC trusted publishing instead
  - keep `id-token: write` in the workflow so npm can mint short-lived publish credentials automatically
  - update the README release section to note the required npm trusted publisher configuration

- Impact:
  - avoids token/owner drift causing npm `404` publish failures for an existing package
  - requires the npm package to be configured with a trusted publisher matching this repository and workflow

- Follow-ups:
  - configure trusted publishing on npm for `@onyx.dev/onyx-database` if it is not already set
