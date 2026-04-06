const API_BASE = import.meta.env.VITE_API_URL || "";

export interface SwatchEntry {
  object_name: string;
  view_url: string;
  size: number | null;
  created_at: string | null;
}

export async function getUploadUrl(
  filename: string,
  folder: "swatches" | "typography" = "swatches"
): Promise<{ upload_url: string; object_name: string }> {
  const res = await fetch(
    `${API_BASE}/api/presign/upload?filename=${encodeURIComponent(filename)}&folder=${folder}`
  );
  if (!res.ok) throw new Error(`Failed to get upload URL: ${res.statusText}`);
  return res.json();
}

export async function uploadBlob(uploadUrl: string, blob: Blob): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: blob,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
}

export async function listSwatches(): Promise<SwatchEntry[]> {
  const res = await fetch(`${API_BASE}/api/swatches`);
  if (!res.ok) throw new Error(`Failed to list swatches: ${res.statusText}`);
  const data = await res.json();
  return data.swatches;
}

export async function listTypography(): Promise<SwatchEntry[]> {
  const res = await fetch(`${API_BASE}/api/typography`);
  if (!res.ok) throw new Error(`Failed to list typography: ${res.statusText}`);
  const data = await res.json();
  return data.typography;
}

export interface CustomFontEntry {
  family: string;
  variants: string[];
  files: Record<string, string>;
}

function getFontContentType(filename: string): string {
  const ext = "." + filename.split(".").pop()!.toLowerCase();
  const types: Record<string, string> = {
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };
  return types[ext] ?? "application/octet-stream";
}

export async function getFontFileUploadUrl(
  family: string,
  variant: string,
  ext: string
): Promise<{ upload_url: string; object_name: string }> {
  const res = await fetch(
    `${API_BASE}/api/presign/font?family=${encodeURIComponent(family)}&variant=${encodeURIComponent(variant)}&ext=${encodeURIComponent(ext)}`
  );
  if (!res.ok) throw new Error(`Failed to get font upload URL: ${res.statusText}`);
  return res.json();
}

export async function uploadFontFile(uploadUrl: string, file: File): Promise<void> {
  const contentType = getFontContentType(file.name);
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`Font upload failed: ${res.statusText}`);
}

export async function listCustomFonts(): Promise<CustomFontEntry[]> {
  const res = await fetch(`${API_BASE}/api/fonts`);
  if (!res.ok) throw new Error(`Failed to list custom fonts: ${res.statusText}`);
  const data = await res.json();
  return data.fonts;
}
