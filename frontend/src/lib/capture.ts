import { toBlob } from "html-to-image";

export async function captureElementAsBlob(
  element: HTMLElement
): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
  });

  if (!blob) throw new Error("Failed to create blob from element");
  return blob;
}
