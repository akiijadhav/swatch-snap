# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (from `frontend/`)
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Type-check (tsc -b) then build to dist/
npm run preview  # Preview production build
```

### Backend (from `backend/`)
```bash
uvicorn main:app --reload --port 8000  # Start dev server
python setup_cors.py                    # One-time: configure CORS on GCS bucket
```

The Vite dev server proxies `/api/*` to `localhost:8000`, so run both together during development.

## Architecture

Full-stack monorepo: React/TypeScript frontend + Python/FastAPI backend. The backend never handles image bytes — it only generates presigned GCS URLs. The frontend does all capture, optimization, and direct upload.

### Save workflow
1. User edits colors in `SwatchCard.tsx` → clicks Save
2. `App.tsx` calls `capture.ts`: renders the card element via `html-to-image` at 2× resolution → quantizes to PNG-8 via `upng-js` (50–70% size reduction)
3. Calls `api.ts` → `GET /api/presign/upload` to get a short-lived signed PUT URL
4. Uploads blob directly to GCS via the presigned URL
5. Gallery refreshes: `GET /api/swatches` returns list with fresh signed view URLs + file sizes

### Key modules
- `frontend/src/lib/capture.ts` — HTML→canvas→PNG-8 pipeline
- `frontend/src/lib/api.ts` — Three backend calls: `getUploadUrl`, `uploadBlob`, `listSwatches`
- `frontend/src/lib/tailwind-colors.ts` — Nearest Tailwind color lookup by Euclidean RGB distance
- `frontend/src/components/SwatchCard.tsx` — Card editor with dirty-state tracking and upload lifecycle states
- `frontend/src/components/Gallery.tsx` — Grid of uploaded swatches with file size badges
- `backend/main.py` — FastAPI app: health, presign/upload, presign/view, list swatches endpoints

### Backend auth
Supports two credential modes via `.env`: `GCS_CREDENTIALS_PATH` (file path) or `GCS_CREDENTIALS_BASE64` (base64-encoded JSON). Copy `backend/.env.example` to `backend/.env` to configure.

### Deployment
- Frontend → Vercel (`frontend/vercel.json`)
- Backend → Docker (`backend/Dockerfile`, Python 3.12 slim, exposes port 8000)
