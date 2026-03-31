# LP Builder — A/B Testing Landing Page Platform

Self-hosted landing page builder and A/B testing platform for iGaming affiliate marketing. Upload complete HTML landers, configure CTA URLs, split traffic across variants, and track conversions via S2S postbacks.

Built with Next.js 14, Supabase, and Vercel.

---

## Architecture

```
[Traffic Source] → [Edge Middleware] → [/lp/[slug]]
                        ↓
              Reads campaign config
              Splits traffic by weight
              Sets cookie (variant_id)
                        ↓
              Serves lander HTML directly
              with {{VARIABLE}} replacement
                        ↓
              [User clicks CTA] → /api/click
              → logs click → 302 redirect to operator
                        ↓
              [Operator fires postback] → /api/postback
              → logs conversion in Supabase
```

### Key Concepts

- **Lander** = A complete HTML/CSS/JS landing page stored in the repository. Contains `{{VARIABLE}}` placeholders for customizable content. Images are embedded as base64.
- **Campaign** = The control center. Picks a lander, sets CTA URLs, configures variants, manages traffic split.
- **Variant** = A version of the campaign with its own CTA URLs, variable values, and traffic weight. A/B testing happens at this level.
- **Click** = Tracked redirect from lander CTA to operator URL. Each click gets a unique `click_id`.
- **Conversion** = S2S postback from the operator, matched by `click_id`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel |
| Edge Routing | Vercel Edge Middleware |
| Styling | Tailwind CSS + inline styles |
| Auth | Supabase Auth (email/password) |
| Tracking | S2S postback endpoint |
| Charts | Recharts |

---

## Database Schema

### `landers` — Landing page repository
Stores complete HTML landers with `{{VARIABLE}}` placeholders.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Lander name |
| html | TEXT | Complete HTML content |
| variables | JSONB | Auto-detected variable names `["CTA_URL", "HEADLINE"]` |
| defaults | JSONB | Default values `{"HEADLINE": "₺15.000"}` |
| assets | JSONB | Embedded images `{"logo.png": "data:image/png;base64,..."}` |
| notes | TEXT | Description / notes |
| is_archived | BOOLEAN | Soft delete |

### `campaigns` — Campaign configuration
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Campaign name |
| slug | TEXT | URL path: `/lp/[slug]` |
| status | TEXT | draft / active / paused / archived |
| lander_id | UUID | FK to landers table |
| geo | TEXT | Target geo (TR, DE, etc.) |
| operator | TEXT | Brand name (Bahigo, etc.) |
| traffic_source | TEXT | propellerads, meta, etc. |

### `variants` — A/B test variants
| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| campaign_id | UUID | FK to campaigns |
| name | TEXT | "Control", "Variant B", etc. |
| traffic_weight | INT | Percentage 0-100 |
| is_control | BOOLEAN | Control variant flag |
| cta_url | TEXT | Primary CTA destination URL |
| custom_fields | JSONB | Variable overrides + `CTA_URLS` array |

### `clicks` — Click tracking
| Column | Type | Description |
|---|---|---|
| click_id | TEXT | Unique ID passed to operator |
| campaign_id | UUID | FK to campaigns |
| variant_id | UUID | FK to variants |
| ip, user_agent, geo_country | TEXT | Visitor data |

### `conversions` — Postback data
| Column | Type | Description |
|---|---|---|
| click_id | TEXT | FK to clicks |
| conversion_type | TEXT | registration, ftd, deposit |
| payout | DECIMAL | Revenue amount |
| postback_raw | JSONB | Raw postback data |

### `campaign_stats` — Aggregated view
Pre-computed clicks, conversions, CR, and payout per campaign/variant.

---

## File Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx          # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # Dashboard shell (sidebar + main)
│   │   ├── dashboard/page.tsx         # Overview stats + recent campaigns
│   │   ├── campaigns/
│   │   │   ├── page.tsx               # Campaign list table
│   │   │   ├── new/page.tsx           # Create campaign (single page)
│   │   │   └── [id]/page.tsx          # Campaign detail + variant editor
│   │   └── landers/
│   │       ├── page.tsx               # Lander repository table
│   │       ├── upload/page.tsx        # Upload HTML lander
│   │       └── [id]/page.tsx          # Edit lander HTML/variables/images
│   ├── lp/[slug]/page.tsx             # PUBLIC: serves lander HTML
│   └── api/
│       ├── click/route.ts             # Click tracking + redirect
│       ├── postback/route.ts          # S2S postback receiver
│       └── campaigns/[id]/stats/      # Stats API
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx                # Collapsible nav sidebar
│   │   ├── StatsChart.tsx             # Recharts line charts
│   │   ├── StatusBadge.tsx            # Status indicator
│   │   ├── CampaignCard.tsx           # Campaign card component
│   │   ├── VariantEditor.tsx          # (legacy) Variant edit drawer
│   │   └── TrafficSplitSlider.tsx     # (legacy) Weight slider
│   └── templates/                     # Built-in React LP templates (legacy)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase client
│   │   ├── server.ts                  # Server Supabase client
│   │   └── admin.ts                   # Service role client
│   ├── types.ts                       # TypeScript interfaces
│   ├── traffic-split.ts               # Weighted random selection
│   ├── click-id.ts                    # nanoid click ID generation
│   └── geo.ts                         # Geo detection from headers
├── middleware.ts                       # Edge: traffic splitting + auth
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # Core tables
        ├── 004_lander_repository.sql  # Landers table + lander_id on campaigns
        └── 005_fix_fk_and_assets.sql  # Drop FK, add assets column
```

---

## How It Works

### 1. Upload a Lander

Go to **Landers → Upload**. Drop your HTML, CSS, JS, and image files. Images get embedded as base64 — no external hosting needed.

Add `{{VARIABLE}}` placeholders in your HTML for content that changes per variant:

```html
<h1>{{HEADLINE}}</h1>
<p>{{SUBHEADLINE}}</p>
<a href="{{CTA_URL}}" class="cta-btn">{{CTA_TEXT}}</a>
```

Variables are auto-detected. Set default values if needed.

**Reserved variables:**
- `{{CTA_URL}}` — Auto-injected tracked click URL (primary)
- `{{CTA_URL_2}}`, `{{CTA_URL_3}}` — Additional tracked URLs for multi-CTA rotation
- `{{HEADLINE}}`, `{{SUBHEADLINE}}`, `{{CTA_TEXT}}`, `{{CTA_COLOR}}` — Standard fields

### 2. Create a Campaign

Go to **Campaigns → New**. Fill in:
1. **Details**: Name, slug, operator, GEO, traffic source
2. **Lander**: Pick from your repository
3. **CTA URLs**: Set up to 3 destination URLs (traffic split equally on each click)
4. **Variables**: Override any lander variables

### 3. Manage Variants

From the campaign detail page:
- **Add variants** with different CTA URLs or variable values
- **Set traffic weights** (how much traffic each variant gets)
- **Edit** each variant's CTA URLs and variable overrides
- **Declare winner** → sets one variant to 100% traffic
- **Delete** underperforming variants

### 4. Traffic Flow

When a visitor hits `/lp/your-slug`:
1. Edge Middleware checks for existing variant cookie
2. If none, runs weighted random selection and sets cookie (30-day)
3. Page route fetches lander HTML from Supabase
4. Replaces `{{VARIABLES}}` with variant-specific values
5. `{{CTA_URL}}` becomes a tracked redirect URL
6. Serves the complete HTML in an iframe (preserves full DOM)

### 5. Click Tracking

CTA clicks go through `/api/click`:
1. Generates unique `click_id` (nanoid 12 chars)
2. Records click with campaign, variant, IP, UA, geo
3. 302 redirects to operator URL with `click_id` appended

### 6. Postback / Conversion Tracking

Operator fires postback to:
```
GET /api/postback?click_id={click_id}&type=registration&payout=50
```

The system:
1. Looks up `click_id` to find campaign and variant
2. Records conversion with type, payout, raw data
3. Returns 200 OK

---

## Multi-CTA Rotation

Each variant supports up to 3 CTA URLs. When multiple URLs are set:
- The lander injects a script that randomly picks one URL on each CTA click
- Equal probability distribution across all URLs
- Each click is tracked separately through `/api/click`
- Useful for splitting traffic across multiple operator links or btags

In your lander HTML, you can also place URLs explicitly:
```html
<a href="{{CTA_URL}}">Primary Offer</a>
<a href="{{CTA_URL_2}}">Secondary Offer</a>
<a href="{{CTA_URL_3}}">Third Offer</a>
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=          # Supabase service role key (for APIs)
POSTBACK_SECRET=                     # Optional: shared secret for postback auth
NEXT_PUBLIC_BASE_URL=                # Optional: explicit base URL (auto-detected if not set)
```

**Note:** `NEXT_PUBLIC_BASE_URL` is optional. The system auto-detects the domain from the request `Host` header on every request.

---

## Deployment

### Supabase Setup
1. Create a Supabase project
2. Run migrations in order in the SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/004_lander_repository.sql`
   - `supabase/migrations/005_fix_fk_and_assets.sql`
3. Create a user in Authentication → Users

### Vercel Setup
1. Import the GitHub repo
2. Set environment variables (Supabase URL, keys)
3. Deploy

---

## UI Design

Keitaro/RedTrack-inspired dark theme:
- **Background**: `#0c0c14` (page), `#111118` (cards), `#1e1e2e` (borders)
- **Accent**: `#6366f1` (indigo) for primary actions and highlights
- **Text**: `#e4e4f0` (primary), `#8b8ba0` (secondary), `#6b6b80` (muted)
- **Status**: `#22c55e` (active), `#eab308` (paused), `#ef4444` (error)
- **Numbers**: Monospace font for all stats (CR, clicks, revenue)
- **Layout**: Collapsible sidebar, data tables, modal-based editing

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/click` | GET | Track click + redirect to operator |
| `/api/postback` | GET | Receive S2S conversion postback |
| `/api/campaigns/[id]/stats` | GET | Campaign stats + daily breakdown |
| `/api/campaigns/stats` | GET | Quick stats for all campaigns (Slack/Make.com) |
| `/lp/[slug]` | GET | Serve landing page (public) |

### Click API
```
GET /api/click?campaign_id=X&variant_id=Y&redirect=https://operator.com
```

### Postback API
```
GET /api/postback?click_id=abc123&type=registration&payout=50&currency=USD&external_id=PLAYER1
```

Optional: add `&secret=YOUR_SECRET` if `POSTBACK_SECRET` is configured.

---

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```
