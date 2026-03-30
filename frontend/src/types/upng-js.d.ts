declare module "upng-js" {
  interface Image {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    frames: ArrayBuffer[];
    tabs: Record<string, unknown>;
    data: ArrayBuffer;
  }

  function encode(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[],
    forbidPlte?: boolean
  ): ArrayBuffer;

  function decode(buffer: ArrayBuffer): Image;
  function toRGBA8(img: Image): ArrayBuffer[];
}
