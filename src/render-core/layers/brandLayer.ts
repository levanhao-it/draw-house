import { TYPO, FONT_STACK, SPACE } from '../../design/tokens';
import type { BrandKit } from '../../types/index';
import type { Preset } from '../../design/presets';
import type { Size } from '../geom';

/** Brand footer height at 1080-wide (px). Use to position legend above it. */
export const BRAND_BAND_HEIGHT_1080 =
  TYPO.disclaimer.size * TYPO.disclaimer.lineHeight * 2 + SPACE.md; // ≈ 72

/** Render mandatory footer: disclaimer (left) + hotline/agent (right). G-8: always visible. */
export function drawBrand(
  ctx: CanvasRenderingContext2D,
  frame: Size,
  brand: BrandKit,
  disclaimer: string,
  preset: Preset,
): void {
  const s = frame.w / 1080;
  const pad = SPACE.md * s;
  const lineH = (TYPO.disclaimer.size * TYPO.disclaimer.lineHeight) * s;
  const bandH = lineH * 2 + pad;
  const bandY = frame.h - bandH;

  // Semi-transparent background strip
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, bandY, frame.w, bandH);

  ctx.font = `${TYPO.disclaimer.weight} ${TYPO.disclaimer.size * s}px ${FONT_STACK}`;
  ctx.textBaseline = 'middle';

  // Disclaimer — left side
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'left';
  ctx.fillText(disclaimer, pad, bandY + bandH / 2, frame.w * 0.6);

  // Hotline — right side (required for export, G-8)
  if (brand.hotline) {
    ctx.fillStyle = preset.accent;
    ctx.textAlign = 'right';
    ctx.font = `700 ${TYPO.disclaimer.size * s * 1.1}px ${FONT_STACK}`;
    ctx.fillText(brand.hotline, frame.w - pad, bandY + bandH / 2 - lineH * 0.3);

    if (brand.agentName) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${TYPO.disclaimer.weight} ${TYPO.disclaimer.size * s}px ${FONT_STACK}`;
      ctx.fillText(brand.agentName, frame.w - pad, bandY + bandH / 2 + lineH * 0.5);
    }
  }

  ctx.restore();
}
