// Minimal ambient types for 'gifenc' (no official/@types package) — covers only the
// surface this app actually calls. See https://github.com/mattdesl/gifenc for the full API.
declare module 'gifenc' {
  export type GifPalette = number[][]; // each entry [r,g,b] or [r,g,b,a]

  export interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444';
    oneBitAlpha?: boolean | number;
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    clearAlphaColor?: number;
  }

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): GifPalette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: QuantizeOptions['format'],
  ): Uint8Array;

  export interface WriteFrameOptions {
    palette?: GifPalette;
    first?: boolean;
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    writeHeader(): void;
    reset(): void;
    readonly buffer: ArrayBuffer;
  }

  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GIFEncoderInstance;
}
