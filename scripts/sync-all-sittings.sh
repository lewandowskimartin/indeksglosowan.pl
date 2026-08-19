#!/bin/bash
# Syncs all sittings for Sejm term 10.
# Usage: ADMIN_SECRET=your-secret bash scripts/sync-all-sittings.sh
# Override range with: FROM=10 TO=30 ADMIN_SECRET=your-secret bash scripts/sync-all-sittings.sh

HOST="${HOST:-https://www.nawigatorwyborczy.pl}"
FROM="${FROM:-1}"
TO="${TO:-54}"

if [ -z "$ADMIN_SECRET" ]; then
  echo "Error: ADMIN_SECRET env var is required."
  echo "Usage: ADMIN_SECRET=your-secret bash scripts/sync-all-sittings.sh"
  exit 1
fi

echo "Syncing sittings $FROM–$TO on $HOST"
echo "---"

total_saved=0
total_skipped=0

for i in $(seq $FROM $TO); do
  response=$(curl -s -H "x-admin-secret: $ADMIN_SECRET" "$HOST/api/admin/sync?sitting=$i")
  saved=$(echo "$response" | grep -o '"newVotingsSaved":[0-9]*' | grep -o '[0-9]*')
  skipped=$(echo "$response" | grep -o '"noiseSkipped":[0-9]*' | grep -o '[0-9]*')
  echo "Sitting $i → saved: ${saved:-0}, skipped: ${skipped:-0}"
  total_saved=$((total_saved + ${saved:-0}))
  total_skipped=$((total_skipped + ${skipped:-0}))
  sleep 1
done

echo "---"
echo "Done. Total saved: $total_saved | Total noise skipped: $total_skipped"
