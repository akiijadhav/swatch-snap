import { toCanvas } from "html-to-image";
import UPNG from "upng-js";

export async function captureElementAsBlob(
  element: HTMLElement
): Promise<Blob> {
  const canvas = await toCanvas(element, {
    pixelRatio: 2,
    cacheBust: true,
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const { width, height } = canvas;
  const rgba = ctx.getImageData(0, 0, width, height).data;

  const pngBuffer = UPNG.encode([rgba.buffer], width, height, 256);

  return new Blob([pngBuffer], { type: "image/png" });
}
