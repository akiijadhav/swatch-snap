import { toCanvas } from "html-to-image";
import UPNG from "upng-js";

export async function captureElementAsBlob(
  element: HTMLElement,
  quality: "png8" | "png24" = "png8"
): Promise<Blob> {
  // Wait for all pending font loads to settle before cloning the DOM
  await document.fonts.ready;

  const canvas = await toCanvas(element, {
    pixelRatio: 2,
    cacheBust: true,
  });

  if (quality === "png24") {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const { width, height } = canvas;
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const pngBuffer = UPNG.encode([rgba.buffer], width, height, 256);

  return new Blob([pngBuffer], { type: "image/png" });
}
