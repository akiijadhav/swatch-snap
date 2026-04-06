import base64
import json
import os
import datetime
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import storage

load_dotenv()

app = FastAPI(title="Swatch Upload API")

BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "htmltocanvas-swatches")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "PUT", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def get_storage_client() -> storage.Client:
    """
    Create a GCS client. Supports two auth modes:
    1. GCS_CREDENTIALS_JSON env var (base64-encoded service account JSON) - for cloud deploys
    2. GOOGLE_APPLICATION_CREDENTIALS env var (file path) - for local dev
    """
    creds_b64 = os.getenv("GCS_CREDENTIALS_JSON")
    if creds_b64:
        from google.oauth2 import service_account
        creds_info = json.loads(base64.b64decode(creds_b64))
        credentials = service_account.Credentials.from_service_account_info(creds_info)
        return storage.Client(credentials=credentials, project=creds_info.get("project_id"))
    return storage.Client()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/presign/upload")
def presign_upload(
    filename: str = Query(..., description="Desired filename"),
    folder: str = Query("swatches", description="GCS folder: 'swatches' or 'typography'"),
):
    if folder not in ("swatches", "typography"):
        raise HTTPException(status_code=400, detail="folder must be 'swatches' or 'typography'")
    try:
        client = get_storage_client()
        bucket = client.bucket(BUCKET_NAME)

        ext = os.path.splitext(filename)[1] or ".png"
        object_name = f"{folder}/{uuid.uuid4().hex}{ext}"

        blob = bucket.blob(object_name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="PUT",
            content_type="image/png",
        )

        return {"upload_url": url, "object_name": object_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/presign/view")
def presign_view(
    object_name: str = Query(..., description="GCS object name to view"),
):
    try:
        client = get_storage_client()
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(object_name)

        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(hours=1),
            method="GET",
        )

        return {"view_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def list_folder(folder: str) -> list:
    client = get_storage_client()
    bucket = client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix=f"{folder}/"))
    items = []
    for b in sorted(blobs, key=lambda x: x.time_created or datetime.datetime.min, reverse=True):
        if b.name.endswith("/"):
            continue
        view_url = b.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(hours=1),
            method="GET",
        )
        items.append({
            "object_name": b.name,
            "view_url": view_url,
            "size": b.size,
            "created_at": b.time_created.isoformat() if b.time_created else None,
        })
    return items


@app.get("/api/swatches")
def list_swatches():
    """List all uploaded color swatches."""
    try:
        return {"swatches": list_folder("swatches")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/typography")
def list_typography():
    """List all uploaded typography cards."""
    try:
        return {"typography": list_folder("typography")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
