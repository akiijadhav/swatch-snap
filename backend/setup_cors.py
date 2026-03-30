"""One-time script to set CORS on the GCS bucket."""
import os

from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()

client = storage.Client.from_service_account_json("./service-account.json")
bucket = client.bucket(os.getenv("GCS_BUCKET_NAME", "htmltocanvas-swatches"))

origins = [
    "http://localhost:5173",
    "http://localhost:4173",
]

frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

bucket.cors = [
    {
        "origin": origins,
        "method": ["PUT", "GET"],
        "responseHeader": ["Content-Type"],
        "maxAgeSeconds": 3600,
    }
]
bucket.patch()

print(f"CORS set on bucket: {bucket.name}")
print(f"Origins: {origins}")
