import type { ImageKind } from '../../types/index';

/** Heuristic: sample a 32×32 thumbnail to classify image type. */
export function classifyImage(bmp: ImageBitmap): ImageKind {
  const W = 32, H = 32;
  const oc = new OffscreenCanvas(W, H);
  // Non-null assertion safe: OffscreenCanvas always supports '2d'
  const ctx = oc.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const total = W * H;
  let white = 0, lightSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    if (r > 220 && g > 220 && b > 220) white++;
    lightSum += (r + g + b) / 3;
  }

  if (white / total > 0.6) return 'floorplan';
  if (lightSum / total > 180) return 'map';
  return 'perspective';
}
