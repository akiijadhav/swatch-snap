import { useState } from "react";
import type { SwatchEntry } from "@/lib/api";

interface GalleryProps {
  entries: SwatchEntry[];
  loading: boolean;
}

export default function Gallery({ entries, loading }: GalleryProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="w-full max-w-3xl text-center py-8">
        <p className="text-sm text-muted-foreground">Loading swatches...</p>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const copyUrl = async (url: string, index: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full max-w-3xl">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Uploaded Swatches ({entries.length})
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {entries.map((entry, i) => (
          <div
            key={entry.object_name}
            className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
          >
            <img
              src={entry.view_url}
              alt={entry.object_name}
              className="w-full h-auto"
            />
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <span
                className="text-xs text-muted-foreground truncate flex-1 font-mono"
                title={entry.object_name}
              >
                {entry.object_name.replace("swatches/", "")}
              </span>
              <button
                onClick={() => copyUrl(entry.view_url, i)}
                className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors shrink-0"
              >
                {copiedIndex === i ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
