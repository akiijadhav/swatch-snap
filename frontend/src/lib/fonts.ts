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
  const fontFamily = font.family.replace(/\s+/g, "+");
  const fontVariant = variant === "regular" ? "400" : variant;
  return `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${fontVariant}&display=swap`;
}

export async function loadFont(
  fontFamily: string,
  variant = "regular"
): Promise<void> {
  const key = `${fontFamily}::${variant}`;
  if (loadedFonts.has(key)) return;

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
