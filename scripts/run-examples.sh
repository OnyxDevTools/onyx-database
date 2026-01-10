#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
examples_root="${repo_root}/examples"

export ONYX_CONFIG_PATH="${examples_root}/onyx-database.json"
export ONYX_SCHEMA_PATH="${examples_root}/onyx.schema.json"

examples=(
  "delete/by-id:delete/by-id"
  "delete/query:delete/query"
  "document/save-get-delete:document/save-get-delete-document"
  "query/aggregate-avg:query/aggregate-avg"
  "query/aggregates-with-grouping:query/aggregates-with-grouping"
  "query/basic:query/basic"
  "query/compound:query/compound"
  "query/find-by-id:query/find-by-id"
  "query/first-or-null:query/first-or-null"
  "query/in-partition:query/in-partition"
  "query/inner-query:query/inner-query"
  "query/list:query/list"
  "query/not-inner-query:query/not-inner-query"
  "query/order-by:query/order-by"
  "query/resolver:query/resolver"
  "query/search-by-resolver-fields:query/search-by-resolver-fields"
  "query/select:query/select"
  "query/sorting-and-paging:query/sorting-and-paging"
  "query/update:query/update"
  "save/basic:save/basic"
  "save/batch-save:save/batch-save"
  "save/cascade:save/cascade"
  "save/cascade-builder:save/cascade-builder"
  "schema/basic:schema/basic"
  "secrets/basic:secrets/basic"
  "stream/close:stream/close"
  "stream/create-events:stream/create-events"
  "stream/delete-events:stream/delete-events"
  "stream/query-stream:stream/query-stream"
  "stream/update-events:stream/update-events"
)

marker="example: completed"
line_width=50
green=$'\033[32m'
red=$'\033[31m'
reset=$'\033[0m'
passed=0
failed=0
declare -a failed_names=()
declare -a failed_logs=()

if [[ ! -d "${examples_root}/node_modules" ]]; then
  npm ci --prefix "${examples_root}"
fi

if [[ ! -f "${examples_root}/onyx/types.ts" ]]; then
  npm run --prefix "${examples_root}" gen:onyx
fi

# seed data for examples (fails fast on errors)
echo "seeding examples..."
if ! seed_output=$(cd "${examples_root}" && npm exec -- tsx seed.ts 2>&1); then
  echo "seed failed:"
  echo "$seed_output"
  exit 1
fi
echo "seed output:"
echo "$seed_output"
echo

for entry in "${examples[@]}"; do
  name=${entry%%:*}
  path=${entry#*:}
  status="FAIL"
  output=""

  if output=$(cd "${examples_root}" && npm exec -- tsx "${path}.ts" 2>&1); then
    if [[ "$output" == *"$marker"* ]]; then
      status="PASS"
      ((passed++))
    else
      status="FAIL"
      ((failed++))
      failed_names+=("$name")
      failed_logs+=("$output")
    fi
  else
    status="FAIL"
    ((failed++))
    failed_names+=("$name")
    failed_logs+=("$output")
  fi

  dots_count=$((line_width - ${#name} - ${#status}))
  if ((dots_count < 1)); then
    dots_count=1
  fi
  dots=$(printf '%*s' "$dots_count" '' | tr ' ' '.')
  color="$red"
  if [[ "$status" == "PASS" ]]; then
    color="$green"
  fi
  printf '%s%s%s%s%s\n' "$name" "$dots" "$color" "$status" "$reset"
done

if ((failed > 0)); then
  echo
  echo "failed logs"
  echo "-----------"
  for i in "${!failed_names[@]}"; do
    echo "[$((i+1))] ${failed_names[$i]}"
    echo "${failed_logs[$i]}"
    echo "-----------"
  done
fi

echo
echo "totals"
echo "------"
printf 'PASSED: %s%d%s\n' "$green" "$passed" "$reset"
printf 'FAILED: %s%d%s\n' "$red" "$failed" "$reset"

if ((failed > 0)); then
  # Exit with the number of failures (capped at 255 to satisfy POSIX exit codes)
  exit_code=$failed
  if ((exit_code > 255)); then
    exit_code=255
  fi
  exit "$exit_code"
fi
