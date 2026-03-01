# AGENTS.md - Glimmer Bistro v2 Dev Context

## Purpose

This project implements the Glimmer Bistro image placement MVP:
- upload image
- attach to target/slot
- publish/retract/reorder/move via placement short code
- render on Next.js pages

## Repo layout

- `src/` -> Next.js frontend
- `backend/` -> Express API + Postgres integration
- `compose.yml` -> `db`, `api`, `web` stack
- `OPENCLAW_README.md` -> operations/runbook for upload workflows

## Core files

- Frontend API client: `src/lib/content.ts`
- Event page: `src/app/events/valentine/page.tsx`
- Event uploader UI: `src/components/EventUploadPanel.tsx`
- Backend API entry: `backend/src/index.ts`
- Validation/slot rules: `backend/src/validation.ts`
- DB schema: `backend/sql/init.sql`

## API contract (MVP)

- `POST /v1/upload` (admin bearer required)
- `GET /v1/content?targetType=...&targetKey=...` (published only)
- `PATCH /v1/placements/:shortCode` (admin bearer required)

Short code formats:
- placement: `P-XXXXXX`
- media: `M-XXXXXX`

## Local development quick start

```bash
# root
npm install

# backend
cd backend && npm install && npm run build

# root build/lint
cd ..
npm run lint
npm run build

docker compose -f compose.yml up -d --build
```

## Environment notes

### Root `.env`
- `CONTENT_API_BASE_URL`
- `NEXT_PUBLIC_CONTENT_API_BASE_URL`
- `WEB_ORIGIN`
- `PUBLIC_BASE_URL`
- `ADMIN_TOKEN`

### Backend `.env` (optional local dev)
- same API/db/storage keys as `backend/.env.example`

## Deployment notes

Vercel frontend requires:
- `CONTENT_API_BASE_URL=<public api URL>`
- `NEXT_PUBLIC_CONTENT_API_BASE_URL=<public api URL>`

If using Cloudflare tunnel, URL can change. Update env + redeploy when it changes.

## Current UX decisions

- Valentine gallery renders after course menu.
- Upload panel exists on event page for quick operator uploads.
- Upload panel requires manual token entry (not hardcoded in frontend).

## Guardrails for future edits

- Do not commit `backend/node_modules` or `backend/dist`.
- Keep `targetType/slot` restrictions aligned with `validation.ts`.
- Operations that hide content should set placement `status` to `draft` or `archived`.
