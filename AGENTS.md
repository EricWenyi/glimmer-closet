# AGENTS.md — Glimmer Closet Dev Context

## Project Overview

Glimmer Closet is a smart wardrobe app.
- **Frontend**: Next.js 15 (App Router), TypeScript, CSS variables, deployed on Vercel
- **Backend**: Express + PostgreSQL, runs via Docker Compose locally
- **Phase 1** (complete): frontend-first with mocked AI; real weather via Open-Meteo
- **Phase 2** (planned): wire real Kimi 2.5 vision for cloth analysis and outfit recommendation

---

## Repo Layout

```
src/                    Next.js frontend
  app/
    page.tsx            Main page — tab bar (My Closet / Today's Look) + state
    globals.css         All styles (CSS variables, no Tailwind utilities)
    api/upload/
      route.ts          Server-side proxy: POST /api/upload → backend (keeps ADMIN_TOKEN secret)
  components/
    ClothCard.tsx       Displays one clothing item card
    FilterBar.tsx       Filter chips (category, color, season, occasion, search)
    UploadModal.tsx     Upload flow: pick → AI analyze → confirm → save
    WeatherBanner.tsx   Shows real weather (Open-Meteo, geolocation)
    OutfitCard.tsx      Selectable outfit card with item thumbnails
    TodaysLookTab.tsx   "Today's Look" tab: weather + mock outfit recommendations
  lib/
    api.ts              All API functions + shared TypeScript types

backend/
  src/
    index.ts            Express API (all routes)
    validation.ts       Zod schemas for all request/response types
    db.ts               PostgreSQL pool
    storage.ts          Image upload (local disk or Cloudflare R2)
    codes.ts            Short code generator (C-XXXXXX format)
  sql/
    init.sql            DB schema

compose.yml             Docker Compose: db (Postgres), api (backend), web (Next.js)
.env                    Root env vars (backend reads from here via compose)
.env.local              Next.js local env vars (not committed)
OPENCLAW_README.md      Operations runbook (curl examples)
```

---

## Environment Variables

### Root `.env` (used by Docker Compose and backend)

| Variable | Example | Purpose |
|---|---|---|
| `ADMIN_TOKEN` | `change_me` | Bearer token required for write operations |
| `NEXT_PUBLIC_CONTENT_API_BASE_URL` | `http://localhost:4001` | Backend URL visible to browser |
| `CONTENT_API_BASE_URL` | `http://api:4000` | Backend URL inside Docker network |
| `WEB_ORIGIN` | `https://glimmer-closet.vercel.app` | CORS allow-origin for backend |
| `PUBLIC_BASE_URL` | `http://localhost:4001` | Public URL for image links |

### `.env.local` (Next.js only, not committed)

```
ADMIN_TOKEN=change_me          # Same value as root .env
```

---

## Backend API

**Base URL (local):** `http://localhost:4001`
**Auth:** Write endpoints require `Authorization: Bearer <ADMIN_TOKEN>` header.
**Read endpoints** (`GET /v1/clothes`) are public — no auth needed.

---

### Enum Values

These are the only accepted values for enum fields:

| Field | Values |
|---|---|
| `category` | `top` `bottom` `dress` `outerwear` `shoes` `accessory` `bag` |
| `colors` | `black` `white` `gray` `red` `blue` `green` `yellow` `pink` `purple` `brown` `beige` `multicolor` |
| `seasons` | `spring` `summer` `autumn` `winter` `all-season` |
| `occasions` | `daily` `work` `sport` `formal` `casual` |
| `status` | `draft` `published` `archived` |

---

### `GET /v1/clothes` — List clothes

Public. Returns published items by default.

**Query params** (all optional):

| Param | Type | Example | Notes |
|---|---|---|---|
| `category` | enum | `top` | Filter by single category |
| `colors` | comma-separated | `black,white` | Matches any of the given colors |
| `seasons` | comma-separated | `spring,summer` | Matches any of the given seasons |
| `occasions` | comma-separated | `daily,work` | Matches any of the given occasions |
| `status` | `published`/`draft`/`archived`/`all` | `published` | Default: `published` |
| `q` | string | `连衣裙` | Full-text search on name + description |
| `limit` | int (1–200) | `50` | Default: `100` |
| `offset` | int | `0` | Default: `0` |

**Response `200`:**

```json
{
  "items": [
    {
      "shortCode": "C-9K2M1A",
      "name": "黑色连衣裙",
      "category": "dress",
      "colors": ["black"],
      "seasons": ["summer"],
      "occasions": ["daily", "formal"],
      "description": "轻薄面料",
      "imageUrl": "http://localhost:4001/uploads/abc123.jpg",
      "status": "published",
      "createdAt": "2026-03-05T10:00:00.000Z",
      "updatedAt": "2026-03-05T10:00:00.000Z"
    }
  ],
  "pagination": { "limit": 100, "offset": 0 }
}
```

---

### `POST /v1/clothes/upload` — Upload a new cloth

**Auth required.** Multipart form data.

**Form fields:**

| Field | Required | Type | Notes |
|---|---|---|---|
| `image` | yes | file | JPEG/PNG/WebP, max 15 MB |
| `name` | yes | string | 1–200 chars |
| `category` | yes | enum | See enum table above |
| `colors` | no | comma-separated string | e.g. `black,white` |
| `seasons` | no | comma-separated string | e.g. `spring,summer` |
| `occasions` | no | comma-separated string | e.g. `daily,work` |
| `description` | no | string | Max 2000 chars |
| `status` | no | `draft`/`published` | Default: `published` |

**Response `201`:**

```json
{
  "ok": true,
  "cloth": { /* same Cloth object as in GET /v1/clothes */ }
}
```

**curl example:**

```bash
curl -X POST http://localhost:4001/v1/clothes/upload \
  -H "Authorization: Bearer change_me" \
  -F "image=@/path/to/cloth.jpg" \
  -F "name=白色衬衫" \
  -F "category=top" \
  -F "colors=white" \
  -F "seasons=spring,summer" \
  -F "occasions=daily,work" \
  -F "status=published"
```

---

### `PATCH /v1/clothes/:shortCode` — Update a cloth

**Auth required.** JSON body. Short code format: `C-XXXXXX` (uppercase).
Send only the fields you want to change.

**JSON body fields** (all optional):

| Field | Type |
|---|---|
| `name` | string |
| `category` | enum |
| `colors` | array of color enums |
| `seasons` | array of season enums |
| `occasions` | array of occasion enums |
| `description` | string or null |
| `status` | `draft`/`published`/`archived` |

**Response `200`:**

```json
{ "ok": true, "cloth": { /* Cloth object */ } }
```

**curl example:**

```bash
curl -X PATCH http://localhost:4001/v1/clothes/C-9K2M1A \
  -H "Authorization: Bearer change_me" \
  -H "Content-Type: application/json" \
  -d '{"occasions": ["formal"], "status": "published"}'
```

---

### `DELETE /v1/clothes/:shortCode` — Archive a cloth

**Auth required.** Sets status to `archived` (soft delete). Short code format: `C-XXXXXX`.

**Response `200`:**

```json
{ "ok": true, "cloth": { /* Cloth object with status: "archived" */ } }
```

**curl example:**

```bash
curl -X DELETE http://localhost:4001/v1/clothes/C-9K2M1A \
  -H "Authorization: Bearer change_me"
```

---

### `GET /health` — Health check

Public. Returns `{ "ok": true }`.

---

## Frontend API Client (`src/lib/api.ts`)

The frontend uses these functions — helpful to understand what the UI expects:

```typescript
// Fetch clothes with optional filters (calls GET /v1/clothes)
fetchClothes(filters: ClothFilters): Promise<Cloth[]>

// Real weather from Open-Meteo (no API key needed)
fetchWeather(lat: number, lon: number): Promise<WeatherData>

// MOCK — replace in Phase 2 with POST /v1/clothes/analyze
analyzeCloth(image: File): Promise<AnalyzeResult>
// returns: { category, colors, suggestedName }

// MOCK — replace in Phase 2 with POST /v1/outfits/recommend
recommendOutfits(weather: WeatherData, items: Cloth[]): Promise<OutfitRecommendation[]>
```

The Next.js route `POST /api/upload` (in `src/app/api/upload/route.ts`) proxies upload requests to the backend, injecting the `ADMIN_TOKEN` from the server environment so it never reaches the browser.

---

## Short Code Format

Cloth short codes follow the pattern `C-XXXXXX` where `X` is an uppercase alphanumeric character (e.g., `C-9K2M1A`). They are auto-generated on upload.

---

## Local Development

```bash
# Start all services (Postgres + backend + frontend)
docker compose -f compose.yml up -d --build

# Verify backend
curl http://localhost:4001/health

# Frontend runs at http://localhost:3001
```

---

## Phase 2 Placeholders

These are mocked in `src/lib/api.ts` and need real backend endpoints:

1. **`POST /v1/clothes/analyze`** — accepts a clothing image, returns `{ category, colors, suggestedName }` (Kimi 2.5 vision)
2. **`POST /v1/outfits/recommend`** — accepts `{ weather, clothShortCodes[] }`, returns outfit groups with labels (Kimi 2.5)
