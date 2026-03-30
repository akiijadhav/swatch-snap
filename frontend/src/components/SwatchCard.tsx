import { useCallback, useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTailwindLabel } from "@/lib/tailwind-colors";

export interface SwatchColor {
  role: string;
  hex: string;
}

const DEFAULT_SWATCHES: SwatchColor[] = [
  { role: "Primary", hex: "#0F172A" },
  { role: "Accent", hex: "#3B82F6" },
  { role: "Secondary", hex: "#647488" },
  { role: "Background", hex: "#F8FAFC" },
];

export type SaveStatus = "idle" | "capturing" | "uploading" | "done" | "error";

interface SwatchCardProps {
  cardRef: React.RefObject<HTMLDivElement>;
  saveStatus: SaveStatus;
  saveError: string | null;
  onSave: () => void;
}

export default function SwatchCard({
  cardRef,
  saveStatus,
  saveError,
  onSave,
}: SwatchCardProps) {
  const [swatches, setSwatches] = useState<SwatchColor[]>(DEFAULT_SWATCHES);
  const [savedSwatches, setSavedSwatches] =
    useState<SwatchColor[]>(DEFAULT_SWATCHES);

  const isDirty = swatches.some((s, i) => s.hex !== savedSwatches[i].hex);

  const updateColor = useCallback((index: number, hex: string) => {
    setSwatches((prev) =>
      prev.map((s, i) => (i === index ? { ...s, hex } : s))
    );
  }, []);

  const handleSave = useCallback(() => {
    setSavedSwatches([...swatches]);
    onSave();
  }, [swatches, onSave]);

  const busy = saveStatus === "capturing" || saveStatus === "uploading";

  const saveLabel: Record<SaveStatus, string> = {
    idle: "Save & Upload",
    capturing: "Capturing…",
    uploading: "Uploading…",
    done: "Saved!",
    error: "Failed",
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
      {/* Capturable card area */}
      <div
        ref={cardRef}
        className="bg-card rounded-2xl shadow-lg border border-border p-8 w-full"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="10" cy="10" r="4" fill="white" fillOpacity="0.9" />
              <circle
                cx="10"
                cy="10"
                r="7"
                stroke="white"
                strokeOpacity="0.4"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Brand Colors
            </h2>
            <p className="text-sm text-muted-foreground">
              Primary, secondary, and neutral palettes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {swatches.map((swatch, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-border flex flex-col"
            >
              <div
                className="h-32 w-full shrink-0"
                style={{ backgroundColor: swatch.hex }}
              />
              <div className="px-3 py-3 bg-card flex flex-col gap-1 grow">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {formatTailwindLabel(swatch.hex)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase shrink-0 mt-0.5">
                    {swatch.hex}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {swatch.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color pickers row — outside capturable card */}
      <div className="grid grid-cols-4 gap-4 w-full">
        {swatches.map((swatch, i) => (
          <ColorPicker
            key={i}
            color={swatch.hex}
            onChange={(hex) => updateColor(i, hex)}
            label={swatch.role}
            className="w-full justify-start"
          />
        ))}
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={busy}
        variant={saveStatus === "done" ? "default" : saveStatus === "error" ? "destructive" : "default"}
        className={cn(
          "px-8 transition-all",
          saveStatus === "done" && "bg-green-500 hover:bg-green-600"
        )}
      >
        {busy && (
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {saveLabel[saveStatus]}
        {isDirty && saveStatus === "idle" && (
          <span className="ml-2 w-2 h-2 rounded-full bg-amber-400 inline-block" />
        )}
      </Button>

      {saveError && (
        <p className="text-xs text-destructive">{saveError}</p>
      )}
    </div>
  );
}
