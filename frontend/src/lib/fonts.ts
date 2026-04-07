export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: string;
  kind: string;
}

export interface CustomFont {
  family: string;
  variants: string[];
  files: Record<string, string>; // variant → signed GCS URL
  source: "custom";
}

export type AnyFont = GoogleFont | CustomFont;

export function isCustomFont(font: AnyFont): font is CustomFont {
  return (font as CustomFont).source === "custom";
}

const API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
const API_URL = "https://www.googleapis.com/webfonts/v1/webfonts";

const loadedFonts = new Set<string>();

let fontsCache: GoogleFont[] | null = null;
let fontsCacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  if (
    fontsCache &&
    fontsCacheTimestamp &&
    Date.now() - fontsCacheTimestamp < CACHE_DURATION
  ) {
    return fontsCache;
  }

  if (!API_KEY) {
    throw new Error(
      "Google Fonts API key is not configured. Add VITE_GOOGLE_FONTS_API_KEY to your .env file."
    );
  }

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}&sort=popularity`);
    if (!response.ok) {
      throw new Error("Failed to fetch Google Fonts");
    }
    const data = await response.json();
    console.log("[Google Fonts API] response:", data);
    fontsCache = data.items;
    fontsCacheTimestamp = Date.now();
    return data.items;
  } catch (error) {
    if (fontsCache) return fontsCache;
    console.error("Error fetching Google Fonts:", error);
    throw error;
  }
}

export function getFontUrl(font: GoogleFont, variant = "regular"): string {
  const family = font.family.replace(/\s+/g, "+");
  const italic = variant === "italic" || variant.endsWith("italic");
  const weight = variant === "regular" || variant === "italic" ? "400" : variant.replace("italic", "");
  // CSS API v2: italic variants require ital,wght@1,{weight} axis syntax
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  return `https://fonts.googleapis.com/css2?family=${family}:${axis}&display=swap`;
}

export async function loadFont(
  fontFamily: string,
  variant = "regular",
  customUrl?: string
): Promise<void> {
  const key = `${fontFamily}::${variant}`;
  if (loadedFonts.has(key)) return;

  if (customUrl) {
    const weight = variant === "regular" || variant === "italic" ? "400" : variant.replace("italic", "");
    const fontStyle = variant === "italic" || variant.endsWith("italic") ? "italic" : "normal";

    // Fetch font bytes once — used for both FontFace API (browser render) and @font-face style tag (capture)
    const response = await fetch(customUrl);
    const buffer = await response.arrayBuffer();

    // Convert to base64 data URL so html-to-image never re-fetches the URL.
    // cacheBust: true appends a random query param, which invalidates GCS v4 signed URL signatures → 403.
    // A data: URL has no query string — cacheBust can't touch it.
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const ext = customUrl.split("?")[0].split(".").pop() ?? "ttf";
    const dataUrl = `data:font/${ext};base64,${btoa(binary)}`;

    const styleId = `custom-font-${fontFamily.replace(/\s+/g, "-")}-${variant}`;
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `@font-face { font-family: '${fontFamily}'; src: url('${dataUrl}'); font-weight: ${weight}; font-style: ${fontStyle}; }`;
      document.head.appendChild(styleEl);
    }

    // FontFace constructor accepts ArrayBuffer directly — no second network fetch needed
    const face = new FontFace(fontFamily, buffer, { weight, style: fontStyle });
    await face.load();
    document.fonts.add(face);
    loadedFonts.add(key);
    return;
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.href = getFontUrl({ family: fontFamily } as GoogleFont, variant);
    link.rel = "stylesheet";
    link.onload = () => {
      loadedFonts.add(key);
      resolve();
    };
    link.onerror = () => reject(new Error(`Failed to load font: ${fontFamily}`));
    document.head.appendChild(link);
  });
}
