import { useRef, useState, useEffect, useCallback } from "react";
import SwatchCard, { type SaveStatus } from "@/components/SwatchCard";
import Gallery from "@/components/Gallery";
import { captureElementAsBlob } from "@/lib/capture";
import {
  getUploadUrl,
  uploadBlob,
  listSwatches,
  type SwatchEntry,
} from "@/lib/api";

export default function App() {
  const cardRef = useRef<HTMLDivElement>(null!);
  const [gallery, setGallery] = useState<SwatchEntry[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    try {
      setGalleryLoading(true);
      const items = await listSwatches();
      setGallery(items);
    } catch {
      // silently fail -- gallery just won't show
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    setSaveError(null);

    try {
      setSaveStatus("capturing");
      const blob = await captureElementAsBlob(cardRef.current);

      setSaveStatus("uploading");
      const filename = `swatch-${Date.now()}.png`;
      const { upload_url } = await getUploadUrl(filename);
      await uploadBlob(upload_url, blob);

      setSaveStatus("done");
      fetchGallery();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Upload failed");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }, [fetchGallery]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 gap-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Brand Swatch Capture
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit colors, capture the card, and upload to cloud storage
        </p>
      </header>

      <SwatchCard
        cardRef={cardRef}
        saveStatus={saveStatus}
        saveError={saveError}
        onSave={handleSave}
      />
      <Gallery entries={gallery} loading={galleryLoading} />
    </div>
  );
}
