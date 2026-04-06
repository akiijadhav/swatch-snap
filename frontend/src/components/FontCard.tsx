import { useCallback, useEffect, useRef, useState } from "react";
import { FontPicker } from "@/components/ui/font-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, X } from "lucide-react";
import type { AnyFont, CustomFont } from "@/lib/fonts";
import { isCustomFont, loadFont } from "@/lib/fonts";
import type { SaveStatus } from "@/components/SwatchCard";

const PLACEHOLDER = "The quick brown fox jumps over the lazy dog.";

const ROLES = [
  "Title",
  "Heading",
  "Subheading",
  "Section Header",
  "Body",
  "Quotes",
  "Captions",
] as const;
type Role = (typeof ROLES)[number];

const ROLE_BADGE = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";

const WEIGHT_NAMES: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  regular: "Regular",
  "400": "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  "800": "Extra Bold",
  "900": "Black",
  italic: "Regular Italic",
  "100italic": "Thin Italic",
  "200italic": "Extra Light Italic",
  "300italic": "Light Italic",
  "500italic": "Medium Italic",
  "600italic": "Semi Bold Italic",
  "700italic": "Bold Italic",
  "800italic": "Extra Bold Italic",
  "900italic": "Black Italic",
};

function getWeightValue(variant: string) {
  if (variant === "regular" || variant === "italic") return "400";
  return variant.replace("italic", "");
}

function isItalic(variant: string) {
  return variant === "italic" || variant.endsWith("italic");
}

interface FontCardProps {
  cardRef: React.RefObject<HTMLDivElement>;
  saveStatus: SaveStatus;
  saveError: string | null;
  onSave: () => void;
  selectedFont: AnyFont | undefined;
  onFontSelect: (font: AnyFont) => void;
  customFonts: CustomFont[];
  onCustomFontsUploaded: () => void;
}

export default function FontCard({
  cardRef,
  saveStatus,
  saveError,
  onSave,
  selectedFont,
  onFontSelect,
  customFonts,
  onCustomFontsUploaded,
}: FontCardProps) {
  const textRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<Role>("Body");
  const [fontWeight, setFontWeight] = useState("regular");
  const [panelOpen, setPanelOpen] = useState(false);
  const [fontReady, setFontReady] = useState(true);

  const availableWeights = selectedFont ? selectedFont.variants : [];

  // Reset weight when font changes
  useEffect(() => {
    if (!selectedFont) return;
    const variants = selectedFont.variants;
    setFontWeight(variants.includes("regular") ? "regular" : (variants[0] ?? "regular"));
  }, [selectedFont?.family]);

  // Blur-fade on font/weight change
  useEffect(() => {
    if (!selectedFont) return;
    setFontReady(false);
    const t = setTimeout(() => {
      const customUrl = isCustomFont(selectedFont) ? selectedFont.files[fontWeight] : undefined;
      loadFont(selectedFont.family, fontWeight, customUrl)
        .catch(() => {})
        .finally(() => setFontReady(true));
    }, 120);
    return () => clearTimeout(t);
  }, [selectedFont?.family, fontWeight]);

  // Focus editable text when panel opens
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => textRef.current?.focus(), 50);
    }
  }, [panelOpen]);


  const handleTextBlur = useCallback(() => {
    if (textRef.current && !textRef.current.textContent?.trim()) {
      textRef.current.textContent = PLACEHOLDER;
    }
  }, []);

  const handleSave = useCallback(() => {
    if (panelOpen) {
      setPanelOpen(false);
      setTimeout(onSave, 350); // wait for panel close animation (300ms)
    } else {
      onSave();
    }
  }, [panelOpen, onSave]);

  const busy = saveStatus === "capturing" || saveStatus === "uploading";

  const saveLabel: Record<SaveStatus, string> = {
    idle: "Save & Upload",
    capturing: "Capturing…",
    uploading: "Uploading…",
    done: "Saved!",
    error: "Failed",
  };

  const previewStyle: React.CSSProperties = {
    fontFamily: selectedFont?.family ?? "inherit",
    fontWeight: getWeightValue(fontWeight),
    fontStyle: isItalic(fontWeight) ? "italic" : "normal",
    transition: fontReady
      ? "opacity 250ms ease, filter 250ms ease"
      : "opacity 120ms ease, filter 120ms ease",
    opacity: fontReady ? 1 : 0,
    filter: fontReady ? "blur(0px)" : "blur(6px)",
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-3xl">

      {/* ── Capturable card ── */}
      <div
        ref={cardRef}
        className="bg-card border border-border rounded-2xl p-6 w-full relative"
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-5">

          {/* Role badge — display only, always */}
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            ROLE_BADGE
          )}>
            {role}
          </span>

          {/* Edit / Close toggle */}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={cn(
              "p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted",
              panelOpen && "bg-muted text-foreground"
            )}
            title={panelOpen ? "Close" : "Edit font"}
          >
            {panelOpen ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>
        </div>

        {/* Font name */}
        <div className="text-6xl font-bold text-foreground mb-4 leading-none" style={previewStyle}>
          {selectedFont?.family ?? "Select a font"}
        </div>

        {/* Preview text — editable only when panel is open */}
        <div className="relative">
          <div
            ref={textRef}
            contentEditable={panelOpen}
            suppressContentEditableWarning
            onBlur={handleTextBlur}
            style={previewStyle}
            className={cn(
              "text-2xl text-muted-foreground outline-none leading-snug transition-colors rounded-md",
              panelOpen && "cursor-text px-2 py-1 -mx-2 bg-muted/40 ring-1 ring-border text-foreground"
            )}
          >
            {PLACEHOLDER}
          </div>
          {panelOpen && (
            <span className="absolute -top-5 right-0 text-[10px] text-muted-foreground select-none">
              click to edit
            </span>
          )}
        </div>
      </div>

      {/* ── Edit panel ── */}
      <div
        className={cn(
          "w-full overflow-hidden transition-all duration-300 ease-in-out",
          panelOpen ? "max-h-52 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col gap-3">
          {/* Role selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-14 shrink-0">Role</span>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-all",
                    role === r
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-14 shrink-0">Font</span>
            <FontPicker
              value={selectedFont?.family}
              onChange={onFontSelect}
              width={240}
              height={300}
              customFonts={customFonts}
              onCustomFontsUploaded={onCustomFontsUploaded}
            />
          </div>

          {availableWeights.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground w-14 shrink-0 pt-1">Variant</span>
              <div className="flex flex-wrap gap-1.5">
                {availableWeights.map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setFontWeight(variant)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs border transition-all",
                      fontWeight === variant
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                    )}
                    style={{ fontWeight: getWeightValue(variant) }}
                  >
                    {WEIGHT_NAMES[variant] ?? variant}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex items-center w-full justify-end">
        <Button
          onClick={handleSave}
          disabled={busy}
          className={cn(
            "px-8 transition-all",
            saveStatus === "done" && "bg-green-500 hover:bg-green-600",
            saveStatus === "error" && "bg-destructive"
          )}
        >
          {busy && (
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saveLabel[saveStatus]}
        </Button>
      </div>

      {saveError && <p className="text-xs text-destructive w-full text-right">{saveError}</p>}
    </div>
  );
}
