# Upload & Recommendation Redesign

**Date:** 2026-03-05
**Approach:** Frontend-first with mocked API responses, backend wired up later

---

## Overview

Redesign the Glimmer Closet interaction model with two new flows:

1. **Smart Upload** — user drops a photo, AI (Kimi 2.5 via OpenClaw) pre-fills category and colors, user confirms and saves
2. **Today's Look** — weather-aware outfit recommendations assembled from the user's actual wardrobe

---

## App Structure

Main page gains a **tab bar** with two tabs. A floating **"+ Upload" button** (FAB, bottom-right) is always visible regardless of active tab.

```
┌─────────────────────────────────┐
│  Glimmer Closet                 │
│  智能衣柜 · 轻松管理每一件衣服     │
├─────────────────────────────────┤
│  [ My Closet ]  [ Today's Look ]│
├─────────────────────────────────┤
│  ... tab content ...            │
│              [ + Upload ]       │
└─────────────────────────────────┘
```

- **My Closet tab**: existing wardrobe grid + filter bar (unchanged)
- **Today's Look tab**: weather-based outfit recommendations
- **Upload FAB**: opens the upload modal from any tab

---

## Upload Flow (2-step modal)

### Step 1 — Select Image
- Drop zone or file picker
- "Analyze with AI" button calls `POST /v1/clothes/analyze`
- Button shows spinner + "Analyzing..." while waiting

### Step 2 — Confirm & Edit
- Thumbnail of uploaded image
- Pre-filled fields from AI: **Name**, **Category**, **Colors** (chips)
- User-filled fields: **Occasions**, **Seasons**
- All fields are editable — AI fill is a starting point
- "Save to Closet" submits to existing `POST /v1/clothes/upload`

---

## Today's Look Tab

### Weather Banner
- Auto-fetches via **browser geolocation** → **Open-Meteo API** (free, no key required)
- Shows: city · temperature · condition (e.g. "Shanghai · 12°C · Cloudy")
- Fallback: manual city/temperature input if geolocation is denied

### Outfit Cards
- Calls `POST /v1/outfits/recommend` with temperature, condition, and full wardrobe
- Returns 2–3 full outfit combinations, each with a label (e.g. "Casual work", "Weekend")
- Cards displayed in a horizontal scroll row
- Each card shows stacked thumbnails of the actual wardrobe items
- "Try this look" highlights the selected outfit (display only, no state saved)

### States
- **Loading**: skeleton cards while fetching weather + recommendation
- **Empty wardrobe**: prompt to upload clothes first
- **Geolocation denied**: show manual input fallback

---

## API Contract

### `POST /v1/clothes/analyze`
Accepts a clothing image, returns AI classification.

```
Request:  multipart/form-data { image: File }

Response: {
  category: ClothCategory,      // e.g. "bottom"
  colors: ClothColor[],         // e.g. ["black", "gray"]
  suggestedName: string         // e.g. "黑色休闲裤"
}
```

### `POST /v1/outfits/recommend`
Accepts weather context and wardrobe, returns outfit combinations.

```
Request: {
  temperature: number,          // celsius
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "hot" | "cold",
  items: Cloth[]                // full wardrobe
}

Response: {
  outfits: Array<{
    label: string,              // e.g. "Casual work"
    items: Array<{
      shortCode: string,
      role: "top" | "bottom" | "outerwear" | "shoes" | "accessory"
    }>
  }>
}
```

---

## Implementation Strategy

**Phase 1 — Frontend (focus)**
1. Add tab bar to main page
2. Build Upload Modal (Steps 1 & 2) with mocked `analyze` response
3. Build Today's Look tab with mocked `recommend` response + real Open-Meteo weather fetch
4. Wire upload modal to existing `POST /v1/clothes/upload`

**Phase 2 — Backend (later)**
1. Add `POST /v1/clothes/analyze` endpoint using Kimi 2.5 vision API
2. Add `POST /v1/outfits/recommend` endpoint using Kimi 2.5
3. Swap frontend mocks for real calls

---

## Tech Stack (unchanged)
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Express + PostgreSQL
- Weather: Open-Meteo (free, no API key)
- AI: Kimi 2.5 (Moonshot AI) via OpenClaw backend
