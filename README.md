# handy-buddy

Property management services portal — multi-tenant platform powering HaulinBuddy.

## Stack
- **Frontend:** React + TypeScript + Tailwind CSS (bolt.new)
- **Backend:** Supabase (auth, database, RLS)
- **AI:** Anthropic Claude API (conversational booking in ChatRequest)
- **Hosting:** Bolt Cloud

## Structure
```
src/
  components/
    PMDashboard/
      index.tsx          # Shell, routing, sidebar
      DashboardHome.tsx  # Overview, stats, quick actions
      NewRequest.tsx     # Property selector → chat
      ChatRequest.tsx    # Claude-powered booking chat
      Onboarding.tsx     # Tutorial for new users (3 slides)
      PropertiesList.tsx # Read-only, zone-grouped
      RequestsList.tsx   # All requests with slot display
scripts/
  seed.ts                # Seeds all users + properties (run once)
supabase/
  migrations/
    001_companies.sql    # Multi-tenant schema foundation
```

## Setup

### 1. Run database migration
Paste `supabase/migrations/001_companies.sql` into Supabase SQL Editor and run.

### 2. Seed Castle Companies users
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
VITE_APP_URL=https://your-app.bolt.new \
npx ts-node scripts/seed.ts
```

### 3. Environment variables (bolt.new project settings)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_ANTHROPIC_API_KEY=
VITE_APP_URL=
```

## Adding a new property management firm
1. Insert a row into `companies` with a unique `slug`
2. Insert zone rows into `company_zones` for the new company
3. Run `seed.ts --company=<slug>` to invite their users
4. Route `/<slug>` to their branded portal (see `index.tsx`)

## Service zones (Castle Companies)
| Zone | Days | Area |
|------|------|------|
| Zone 1 | Mon & Fri | West Bay (San Pablo, Richmond, El Sobrante, Pinole, Oakland, Castro Valley) |
| Zone 2 | Tue & Thu | Central CCC (Concord, Walnut Creek, Martinez, Pittsburg) |
| Zone 3 | Wed & Sat | South & East (Danville, Livermore, Fairfield, Milpitas) |

2 time slots per day: **AM 10am–12pm** · **PM 1pm–3pm**  
Quick jobs billed as one 3-hour slot.
