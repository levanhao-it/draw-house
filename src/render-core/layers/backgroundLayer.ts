import { coverRect, type Size } from '../geom';

/** Draw the scene image with CSS object-fit:cover semantics. */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: Size,
): void {
  const { x, y, scale } = coverRect({ w: img.naturalWidth, h: img.naturalHeight }, frame);
  ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
}
