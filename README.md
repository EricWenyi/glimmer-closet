# Glimmer Closet (MVP)

Glimmer Closet is a wardrobe management system with the same deployment architecture as Glimmer Bistro:

- Frontend: Next.js (`web`, local `3001`, Vercel for production)
- Backend API: Express + Postgres + R2 (`api`, local `4001`)
- Database: Postgres (`db`, local `5433`)
- Public API access: Cloudflare Tunnel (for Vercel/WhatsApp automation integration)

## Quick Start

1. Prepare env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

2. Start local stack:

```bash
docker compose -f compose.yml up --build
```

3. Open services:

- Web: `http://localhost:3001`
- API health: `http://localhost:4001/health`

## API (MVP)

- `POST /v1/clothes/upload` (admin)
  - multipart fields: `image`, `name`, `category`, `colors`, `seasons`, `occasions`
  - optional: `description`, `status` (`draft|published`, default `published`)
- `GET /v1/clothes`
  - filters: `category`, `colors`, `seasons`, `occasions`, `q`, `status`
- `PATCH /v1/clothes/:shortCode` (admin)
  - partial updates: `name`, `category`, tags, `description`, `status`
- `DELETE /v1/clothes/:shortCode` (admin)
  - soft delete by changing status to `archived`

## Data Model

Single table: `clothes`

- `short_code`: `C-XXXXXX`
- `name`, `category`
- `colors[]`, `seasons[]`, `occasions[]`
- `description`, `image_url`
- `status`: `draft|published|archived`

## Deployment Notes

- Set Vercel envs to your Cloudflare tunnel URL:
  - `CONTENT_API_BASE_URL=https://<your-tunnel>.trycloudflare.com`
  - `NEXT_PUBLIC_CONTENT_API_BASE_URL=https://<your-tunnel>.trycloudflare.com`
- Set backend envs for cross-origin/image URL correctness:
  - `WEB_ORIGIN=https://<your-vercel-domain>`
  - `PUBLIC_BASE_URL=https://<your-tunnel>.trycloudflare.com`
