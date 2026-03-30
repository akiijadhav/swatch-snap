# Brand Swatch Capture

A prototype tool for editing brand color swatches, capturing them as high-resolution PNGs, and uploading to Google Cloud Storage. Built to produce clean swatch images for AI-powered design workflows.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend**: Python FastAPI
- **Storage**: Google Cloud Storage (presigned URLs)
- **Capture**: [html-to-image](https://github.com/bubkoo/html-to-image) + [upng-js](https://github.com/nickthedude/upng-js) (browser-native rendering with PNG-8 quantization)

## Features

- 4 editable color swatches (Primary, Accent, Secondary, Background)
- Color picker powered by react-colorful wrapped in shadcn Popover
- Dynamic Tailwind color name detection (nearest match from full Tailwind palette)
- 2x resolution PNG capture via browser-native SVG foreignObject rendering
- Optimized PNG-8 output via upng-js quantization (50-70% smaller than raw PNG-24)
- Direct-to-GCS upload using presigned PUT URLs (backend never touches image bytes)
- Gallery with file size badges, fetched live from GCS on every page load

## Project Structure

```
HtmltoCanvas/
  frontend/                     # Vite + React + Tailwind v4 + shadcn/ui
    src/
      components/
        SwatchCard.tsx           # Swatch card with color pickers + save button
        Gallery.tsx              # Gallery of uploaded swatch images
        ui/
          button.tsx             # shadcn Button
          popover.tsx            # shadcn Popover
          color-picker.tsx       # react-colorful in shadcn Popover
      lib/
        api.ts                   # API client (upload, view, list)
        capture.ts               # html-to-image + upng-js optimized capture
        tailwind-colors.ts       # Tailwind palette lookup (242 colors)
        utils.ts                 # shadcn cn() utility
      App.tsx
      main.tsx
      index.css                  # Tailwind v4 + shadcn theme
    vite.config.ts
    vercel.json
    components.json              # shadcn config
  backend/                       # FastAPI
    main.py                      # API endpoints
    setup_cors.py                # One-time CORS setup script
    requirements.txt
    Dockerfile
    .env.example
  README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/presign/upload?filename=...` | Get signed PUT URL for upload |
| GET | `/api/presign/view?object_name=...` | Get signed GET URL for viewing |
| GET | `/api/swatches` | List all swatches with fresh signed view URLs |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- A GCS bucket + service account with `Storage Object Admin` role

### Backend

```bash
cd backend
python -m venv .venv

# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env    # fill in your values
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `localhost:8000` in dev mode. Open http://localhost:5173.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `GCS_BUCKET_NAME` | GCS bucket name | Yes |
| `FRONTEND_URL` | Frontend origin for CORS | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (local dev) | Option A |
| `GCS_CREDENTIALS_JSON` | Base64-encoded service account JSON (cloud deploy) | Option B |

### Frontend (Vercel env vars)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `https://your-api.railway.app`) |

## GCS Setup

1. Create a bucket in [GCP Console](https://console.cloud.google.com/storage)
2. Create a service account with **Storage Object Admin** role
3. Download the JSON key, save as `backend/service-account.json`
4. Set CORS on the bucket:

```bash
# Using the included script (no gcloud needed):
cd backend && python setup_cors.py

# Or with gcloud:
gcloud storage buckets update gs://YOUR_BUCKET --cors-file=cors.json
```

5. For cloud deploy, base64-encode the key:

```bash
# Linux/Mac:
base64 -i service-account.json | tr -d '\n'
# Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))
```

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import in Vercel, set root directory to `frontend`
3. Set env var: `VITE_API_URL` = your backend URL
4. Deploy

### Backend → Railway

1. Connect GitHub repo, set root directory to `backend`
2. Set env vars: `GCS_BUCKET_NAME`, `GCS_CREDENTIALS_JSON`, `FRONTEND_URL`
3. Railway auto-detects the Dockerfile

### Backend → Cloud Run

```bash
cd backend
gcloud run deploy swatch-api \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="GCS_BUCKET_NAME=your-bucket,FRONTEND_URL=https://your-app.vercel.app,GCS_CREDENTIALS_JSON=<base64>"
```

## How It Works

1. User edits swatch colors via color pickers
2. Clicks **Save & Upload**
3. `html-to-image` captures the card at 2x resolution via SVG foreignObject → canvas
4. `upng-js` quantizes the canvas pixels to 256-color PNG-8 (50-70% smaller, visually identical for solid-color content)
5. Frontend gets a presigned PUT URL from the backend
6. Frontend uploads the optimized blob directly to GCS (backend never touches the bytes)
7. Gallery refreshes from GCS via `/api/swatches`, showing file size on each image

## Image Optimization

- Captured at 2x pixel ratio for high-resolution output
- PNG-8 quantization via upng-js (256-color palette) — ideal for solid-color swatch cards
- Typically 50-70% smaller than raw PNG-24 with no visible quality loss
- Uses browser-native rendering (not canvas re-implementation), so all CSS features render correctly
- File size displayed on each gallery thumbnail for visibility
