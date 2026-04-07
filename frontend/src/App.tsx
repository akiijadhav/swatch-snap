import { useRef, useState, useEffect, useCallback } from "react";
import SwatchCard, { type SaveStatus } from "@/components/SwatchCard";
import FontCard from "@/components/FontCard";
import type { AnyFont, CustomFont } from "@/lib/fonts";
import Gallery from "@/components/Gallery";
import { captureElementAsBlob } from "@/lib/capture";
import {
  getUploadUrl,
  uploadBlob,
  listSwatches,
  listTypography,
  listCustomFonts,
  type SwatchEntry,
} from "@/lib/api";

function useSaveCard(
  prefix: string,
  folder: "swatches" | "typography",
  onDone: () => void,
  quality: "png8" | "png24" = "png8"
) {
  const ref = useRef<HTMLDivElement>(null!);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (): Promise<boolean> => {
    if (!ref.current) return false;
    setError(null);
    try {
      setStatus("capturing");
      const blob = await captureElementAsBlob(ref.current, quality);
      setStatus("uploading");
      const { upload_url } = await getUploadUrl(`${prefix}-${Date.now()}.png`, folder);
      await uploadBlob(upload_url, blob);
      setStatus("done");
      onDone();
      setTimeout(() => setStatus("idle"), 2000);
      return true;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
      setTimeout(() => setStatus("idle"), 4000);
      return false;
    }
  }, [folder, onDone, prefix, quality]);

  return { ref, status, error, save };
}

export default function App() {
  const [swatchGallery, setSwatchGallery] = useState<SwatchEntry[]>([]);
  const [typographyGallery, setTypographyGallery] = useState<SwatchEntry[]>([]);
  const [swatchLoading, setSwatchLoading] = useState(true);
  const [typographyLoading, setTypographyLoading] = useState(true);
  const [selectedFont, setSelectedFont] = useState<AnyFont | undefined>(undefined);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  const fetchSwatches = useCallback(async () => {
    try {
      setSwatchLoading(true);
      setSwatchGallery(await listSwatches());
    } catch {
      // silently fail
    } finally {
      setSwatchLoading(false);
    }
  }, []);

  const fetchTypography = useCallback(async () => {
    try {
      setTypographyLoading(true);
      setTypographyGallery(await listTypography());
    } catch {
      // silently fail
    } finally {
      setTypographyLoading(false);
    }
  }, []);

  const fetchCustomFonts = useCallback(async () => {
    try {
      const fonts = await listCustomFonts();
      setCustomFonts(fonts.map((f) => ({ ...f, source: "custom" as const })));
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchSwatches();
    fetchTypography();
    fetchCustomFonts();
  }, [fetchSwatches, fetchTypography, fetchCustomFonts]);

  const swatch = useSaveCard("swatch", "swatches", fetchSwatches, "png8");
  const font = useSaveCard("font", "typography", fetchTypography, "png24");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 gap-16">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Brand Kit Capture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capture brand colors and typography as optimized PNG assets
        </p>
      </header>

      {/* Brand Colors section */}
      <section className="w-full max-w-3xl flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Brand Colors</h2>
          <p className="text-sm text-muted-foreground">Edit and capture your brand color palette</p>
        </div>
        <SwatchCard
          cardRef={swatch.ref}
          saveStatus={swatch.status}
          saveError={swatch.error}
          onSave={swatch.save}
        />
        <Gallery entries={swatchGallery} loading={swatchLoading} title="Saved Color Palettes" />
      </section>

      <div className="w-full max-w-3xl border-t border-border" />

      {/* Typography section */}
      <section className="w-full max-w-3xl flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Typography</h2>
          <p className="text-sm text-muted-foreground">Choose fonts, roles, and weights for your brand</p>
        </div>
        <FontCard
          cardRef={font.ref}
          saveStatus={font.status}
          saveError={font.error}
          onSave={font.save}
          selectedFont={selectedFont}
          onFontSelect={setSelectedFont}
          customFonts={customFonts}
          onCustomFontsUploaded={fetchCustomFonts}
        />
        <Gallery entries={typographyGallery} loading={typographyLoading} title="Saved Typography Cards" />
      </section>
    </div>
  );
}
