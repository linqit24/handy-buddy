#!/bin/bash
# push-to-github.sh
# Pushes all handy-buddy files to github.com/haulinbuddy/handy-buddy
#
# Usage:
#   GITHUB_TOKEN=ghp_your_token bash push-to-github.sh

set -e

REPO="haulinbuddy/handy-buddy"
BRANCH="main"
API="https://api.github.com"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN not set"
  echo "Usage: GITHUB_TOKEN=ghp_... bash push-to-github.sh"
  exit 1
fi

push_file() {
  local path="$1"
  local file="$2"
  local message="$3"

  echo "  → $path"

  # Check if file already exists (need SHA to update)
  SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "$API/repos/$REPO/contents/$path" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null || echo "")

  CONTENT=$(base64 -w 0 "$file")

  if [ -n "$SHA" ]; then
    # Update existing file
    curl -s -X PUT \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Content-Type: application/json" \
      "$API/repos/$REPO/contents/$path" \
      -d "{\"message\":\"$message\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\",\"branch\":\"$BRANCH\"}" > /dev/null
  else
    # Create new file
    curl -s -X PUT \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Content-Type: application/json" \
      "$API/repos/$REPO/contents/$path" \
      -d "{\"message\":\"$message\",\"content\":\"$CONTENT\",\"branch\":\"$BRANCH\"}" > /dev/null
  fi
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR"

echo ""
echo "🚀 Pushing handy-buddy to github.com/$REPO"
echo ""

echo "📁 Dashboard components"
push_file "src/components/PMDashboard/index.tsx"          "$ROOT/src/components/PMDashboard/index.tsx"          "Add PMDashboard index"
push_file "src/components/PMDashboard/ChatRequest.tsx"    "$ROOT/src/components/PMDashboard/ChatRequest.tsx"    "Add ChatRequest (Claude-powered)"
push_file "src/components/PMDashboard/NewRequest.tsx"     "$ROOT/src/components/PMDashboard/NewRequest.tsx"     "Add NewRequest"
push_file "src/components/PMDashboard/DashboardHome.tsx"  "$ROOT/src/components/PMDashboard/DashboardHome.tsx"  "Add DashboardHome"
push_file "src/components/PMDashboard/Onboarding.tsx"     "$ROOT/src/components/PMDashboard/Onboarding.tsx"     "Add Onboarding tutorial"
push_file "src/components/PMDashboard/PropertiesList.tsx" "$ROOT/src/components/PMDashboard/PropertiesList.tsx" "Add PropertiesList (read-only)"
push_file "src/components/PMDashboard/RequestsList.tsx"   "$ROOT/src/components/PMDashboard/RequestsList.tsx"   "Add RequestsList"

echo "📁 Scripts"
push_file "scripts/seed.ts" "$ROOT/scripts/seed.ts" "Add Castle Companies seed script"

echo "📁 Migrations"
push_file "supabase/migrations/001_companies.sql" "$ROOT/supabase/migrations/001_companies.sql" "Add multi-tenant schema migration"

echo "📄 README"
push_file "README.md" "$ROOT/README.md" "Add README"

echo ""
echo "✅ Done! View at: https://github.com/$REPO"
echo ""
