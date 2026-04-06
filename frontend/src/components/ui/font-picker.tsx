import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AnyFont, CustomFont, GoogleFont } from "@/lib/fonts";
import { fetchGoogleFonts, isCustomFont, loadFont } from "@/lib/fonts";
import {
  getFontFileUploadUrl,
  listCustomFonts,
  uploadFontFile,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import * as React from "react";
import { List } from "react-window";

type RowAriaAttributes = {
  "aria-posinset": number;
  "aria-setsize": number;
  role: "listitem";
};

const VARIANT_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "italic", label: "Regular Italic" },
  { value: "100", label: "Thin (100)" },
  { value: "100italic", label: "Thin Italic" },
  { value: "200", label: "Extra Light (200)" },
  { value: "200italic", label: "Extra Light Italic" },
  { value: "300", label: "Light (300)" },
  { value: "300italic", label: "Light Italic" },
  { value: "500", label: "Medium (500)" },
  { value: "500italic", label: "Medium Italic" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "600italic", label: "Semi Bold Italic" },
  { value: "700", label: "Bold (700)" },
  { value: "700italic", label: "Bold Italic" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "800italic", label: "Extra Bold Italic" },
  { value: "900", label: "Black (900)" },
  { value: "900italic", label: "Black Italic" },
];

function detectVariantFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").toLowerCase();
  if (base.includes("thinitalic") || base.includes("thin-italic")) return "100italic";
  if ((base.includes("extralight") || base.includes("extra-light") || base.includes("extraleight")) && base.includes("italic")) return "200italic";
  if (base.includes("extralight") || base.includes("extra-light")) return "200";
  if (base.includes("light") && base.includes("italic")) return "300italic";
  if (base.includes("light")) return "300";
  if ((base.includes("mediumitalic") || base.includes("medium-italic"))) return "500italic";
  if (base.includes("medium")) return "500";
  if (base.includes("semibolditalic") || base.includes("semibold-italic")) return "600italic";
  if (base.includes("semibold") || base.includes("semi-bold")) return "600";
  if (base.includes("extrabolditalic") || base.includes("extrabold-italic")) return "800italic";
  if (base.includes("extrabold") || base.includes("extra-bold")) return "800";
  if (base.includes("blackitalic") || base.includes("black-italic")) return "900italic";
  if (base.includes("black")) return "900";
  if (base.includes("bolditalic") || base.includes("bold-italic")) return "700italic";
  if (base.includes("bold")) return "700";
  if (base.includes("thin")) return "100";
  if (base.includes("italic")) return "italic";
  return "regular";
}

function detectFamilyFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const cleaned = base
    .replace(/[-_](thinitalic|thin-italic|thin|extralight|extra-light|lightitalic|light-italic|light|mediumitalic|medium-italic|medium|semibolditalic|semibold-italic|semibold|semi-bold|bolditalic|bold-italic|extrabolditalic|extrabold-italic|extrabold|extra-bold|blackitalic|black-italic|black|bold|regularitalic|regular-italic|regular|italic)$/i, "")
    .replace(/[-_](100|200|300|400|500|600|700|800|900)(italic)?$/i, "");
  return cleaned.replace(/[-_]/g, " ").trim() || base.replace(/[-_]/g, " ").trim();
}

interface PendingFile {
  file: File;
  family: string;
  variant: string;
}

function FontListItem({
  font,
  isSelected,
  onSelect,
}: {
  font: GoogleFont;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isFontLoaded, setIsFontLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!isFontLoaded) {
      loadFont(font.family)
        .then(() => setIsFontLoaded(true))
        .catch((error) => console.error("Failed to load font:", error));
    }
  }, [isFontLoaded, font.family]);

  return (
    <CommandItem
      value={font.family}
      onSelect={onSelect}
      className="data-[selected=true]:bg-accent flex cursor-pointer items-center gap-2 p-2"
      data-selected={isSelected}
    >
      <Check
        className={cn("h-3 w-3 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{font.family}</span>
        <span
          className={cn(
            "text-muted-foreground text-xs transition-opacity duration-300",
            isFontLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ fontFamily: isFontLoaded ? font.family : "system-ui" }}
        >
          The quick brown fox
        </span>
      </div>
    </CommandItem>
  );
}

interface FontPickerProps {
  onChange?: (font: AnyFont) => void;
  value?: string;
  width?: number;
  height?: number;
  className?: string;
  showFilters?: boolean;
  customFonts?: CustomFont[];
  onCustomFontsUploaded?: () => void;
}

export function FontPicker({
  onChange,
  value,
  width = 300,
  height = 300,
  className,
  showFilters = true,
  customFonts = [],
  onCustomFontsUploaded,
}: FontPickerProps) {
  const [selectedAny, setSelectedAny] = React.useState<AnyFont | null>(null);
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [fonts, setFonts] = React.useState<GoogleFont[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [activeTab, setActiveTab] = React.useState<"google" | "custom">("google");
  const [pendingFiles, setPendingFiles] = React.useState<PendingFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadFonts = async () => {
      try {
        setIsLoading(true);
        const fetchedFonts = await fetchGoogleFonts();
        setFonts(fetchedFonts);
        const font = fetchedFonts.find((f) => f.family === (value ?? "Inter"))
          ?? fetchedFonts[0];
        if (font && !selectedAny) {
          setSelectedAny(font);
          if (!value) onChange?.(font);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load fonts"));
        console.error("Error loading fonts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFonts();
  }, [value]);

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(fonts.map((f) => f.category));
    return Array.from(uniqueCategories).sort();
  }, [fonts]);

  const filteredFonts = React.useMemo(() => {
    return fonts.filter((font) => {
      const matchesSearch = font.family.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !showFilters || selectedCategory === "all" || font.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [fonts, search, selectedCategory, showFilters]);

  const handleSelectFont = React.useCallback(
    (font: GoogleFont) => {
      setSelectedAny(font);
      onChange?.(font);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleSelectCustomFont = React.useCallback(
    (font: CustomFont) => {
      setSelectedAny(font);
      onChange?.(font);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleFileSelection = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).slice(0, 18);
      const newPending: PendingFile[] = files.map((file) => ({
        file,
        family: detectFamilyFromFilename(file.name),
        variant: detectVariantFromFilename(file.name),
      }));
      setPendingFiles((prev) => [...prev, ...newPending].slice(0, 18));
      e.target.value = "";
    },
    []
  );

  const updatePendingFile = React.useCallback(
    (index: number, field: "family" | "variant", val: string) => {
      setPendingFiles((prev) =>
        prev.map((pf, i) => (i === index ? { ...pf, [field]: val } : pf))
      );
    },
    []
  );

  const removePendingFile = React.useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUploadAll = React.useCallback(async () => {
    if (uploading) return;
    setUploading(true);
    try {
      for (const pf of pendingFiles) {
        const ext = "." + pf.file.name.split(".").pop()!.toLowerCase();
        const { upload_url } = await getFontFileUploadUrl(pf.family, pf.variant, ext);
        await uploadFontFile(upload_url, pf.file);
      }
      setPendingFiles([]);
      onCustomFontsUploaded?.();
      // Refresh custom fonts list in API
      await listCustomFonts();
    } catch (err) {
      console.error("Font upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [uploading, pendingFiles, onCustomFontsUploaded]);

  const Row = React.useCallback(
    ({
      index,
      style,
      ariaAttributes,
    }: {
      ariaAttributes: RowAriaAttributes;
      index: number;
      style: React.CSSProperties;
    }) => {
      const font = filteredFonts[index];
      return (
        <div style={style} {...ariaAttributes}>
          <FontListItem
            font={font}
            isSelected={!isCustomFont(selectedAny as AnyFont) && selectedAny?.family === font.family}
            onSelect={() => handleSelectFont(font)}
          />
        </div>
      );
    },
    [filteredFonts, selectedAny, handleSelectFont]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "justify-between",
          className
        )}
        style={{ width }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select font"
      >
        <span className="truncate">
          {selectedAny ? selectedAny.family : "Select font…"}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width }} align="start">
        {/* Tab bar */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("google")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              activeTab === "google"
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Google Fonts
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              activeTab === "custom"
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Custom {customFonts.length > 0 && `(${customFonts.length})`}
          </button>
        </div>

        {activeTab === "google" ? (
          <Command>
            <CommandInput
              placeholder="Search fonts..."
              value={search}
              onValueChange={setSearch}
              className="border-none focus:ring-0"
            />
            <div className="flex items-center justify-between gap-2 border-b px-3 py-1">
              {showFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "flex h-8 items-center gap-2 px-2"
                    )}
                  >
                    <Filter className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm capitalize">
                      {selectedCategory === "all" ? "All Categories" : selectedCategory}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuRadioGroup
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
                      {categories.map((category) => (
                        <DropdownMenuRadioItem
                          key={category}
                          value={category}
                          className="capitalize"
                        >
                          {category}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <span className="text-muted-foreground text-xs">{filteredFonts.length} fonts</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-4 text-sm text-red-500">
                {error.message}
              </div>
            ) : (
              <>
                <CommandEmpty>No fonts found.</CommandEmpty>
                <CommandGroup>
                  <List
                    rowCount={filteredFonts.length}
                    rowHeight={55}
                    rowComponent={Row}
                    rowProps={{}}
                    style={{ height }}
                  />
                </CommandGroup>
              </>
            )}
          </Command>
        ) : (
          <div className="flex flex-col">
            {/* Upload area */}
            <div className="p-3 border-b">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                multiple
                className="hidden"
                onChange={handleFileSelection}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-xs border border-dashed border-border rounded-lg py-2.5 px-3 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              >
                Upload font files (.ttf, .otf, .woff, .woff2)
              </button>
            </div>

            {/* Pending files */}
            {pendingFiles.length > 0 && (
              <div className="p-2 border-b flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                {pendingFiles.map((pf, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={pf.family}
                      onChange={(e) => updatePendingFile(i, "family", e.target.value)}
                      placeholder="Family"
                      className="flex-1 min-w-0 text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <select
                      value={pf.variant}
                      onChange={(e) => updatePendingFile(i, "variant", e.target.value)}
                      className="text-xs border border-border rounded px-1 py-1 bg-background shrink-0"
                    >
                      {VARIANT_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removePendingFile(i)}
                      className="text-muted-foreground hover:text-foreground shrink-0 text-sm leading-none px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleUploadAll}
                  disabled={uploading || pendingFiles.some((f) => !f.family.trim())}
                  className="mt-1 w-full text-xs py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  {uploading
                    ? "Uploading…"
                    : `Upload ${pendingFiles.length} file${pendingFiles.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}

            {/* Existing custom fonts */}
            <div
              className="overflow-y-auto"
              style={{ height: pendingFiles.length > 0 ? Math.max(80, height - 180) : height }}
            >
              {customFonts.length > 0 ? (
                customFonts.map((font) => (
                  <button
                    key={font.family}
                    onClick={() => handleSelectCustomFont(font)}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-3 w-3 shrink-0",
                        selectedAny?.family === font.family ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div>
                      <div className="text-sm font-medium">{font.family}</div>
                      <div className="text-xs text-muted-foreground">
                        {font.variants.length} variant{font.variants.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                ))
              ) : pendingFiles.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  No custom fonts uploaded yet
                </div>
              ) : null}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
