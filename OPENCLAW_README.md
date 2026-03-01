# OpenClaw MVP Runbook (Glimmer Closet)

## 1. Stack and URLs

- Frontend local: `http://localhost:3001`
- Local API: `http://localhost:4001`
- Local Postgres: `localhost:5433`
- Public API via Cloudflare Tunnel: `https://<your-tunnel>.trycloudflare.com`

## 2. Start Services

```bash
docker compose -f compose.yml up -d --build
```

Health check:

```bash
curl http://localhost:4001/health
```

## 3. Upload Cloth

```bash
curl -X POST http://localhost:4001/v1/clothes/upload \
  -H "Authorization: Bearer change_me" \
  -F "image=@/absolute/path/cloth.jpg" \
  -F "name=黑色连衣裙" \
  -F "category=dress" \
  -F "colors=black" \
  -F "seasons=summer" \
  -F "occasions=daily,formal" \
  -F "description=轻薄面料，夏季可日常或正式穿" \
  -F "status=published"
```

Response includes `cloth.shortCode` like `C-9K2M1A`.

## 4. Query Clothes

```bash
curl "http://localhost:4001/v1/clothes?category=dress&colors=black&status=published"
```

## 5. Update by ShortCode

```bash
curl -X PATCH http://localhost:4001/v1/clothes/C-XXXXXX \
  -H "Authorization: Bearer change_me" \
  -H "Content-Type: application/json" \
  -d '{"occasions":["formal"],"status":"published"}'
```

## 6. Archive (Delete API)

```bash
curl -X DELETE http://localhost:4001/v1/clothes/C-XXXXXX \
  -H "Authorization: Bearer change_me"
```

## 7. Vercel Integration

Set Vercel environment variables to tunnel URL:

- `CONTENT_API_BASE_URL=https://<your-tunnel>.trycloudflare.com`
- `NEXT_PUBLIC_CONTENT_API_BASE_URL=https://<your-tunnel>.trycloudflare.com`

Set local `.env`:

- `WEB_ORIGIN=https://<your-vercel-domain>`
- `PUBLIC_BASE_URL=https://<your-tunnel>.trycloudflare.com`

If tunnel URL changes, update both Vercel envs and backend `.env`, then restart compose.
