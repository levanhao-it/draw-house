import { TYPO, ELEVATION, SPACE } from '../../design/tokens';
import { FULL_REVEAL, type MarkerReveal } from '../animation';
import { drawExtrudedText } from '../text/extrudedText';
import { labelFont, labelText, labelRun, labelExtrusion } from '../text/labelStyle';
import { measureRun, fillRun } from '../text/run';
import type { TextMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

const PAD_X_1080 = SPACE.sm * 1.2;
const PAD_Y_1080 = SPACE.xs * 1.3;

/** Draw a freestanding text label centred on (cx, cy): a preset-styled tag by default, or 3D block lettering.
 *  `reveal` (default: fully shown) fades the tag in while a blur defocuses out (8px\u21920). */
export function drawTextTag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  marker: TextMarker,
  preset: Preset,
  scale: number,
  reveal: MarkerReveal = FULL_REVEAL,
): void {
  const style = marker.data;
  const text  = labelText(style.text.trim(), style);
  const { p } = reveal;
  if (!text || p <= 0) return;

  // Label-local scale: the user's size multiplier, so padding and shadow stay in proportion to the text.
  const ls       = scale * (style.labelScale ?? 1);
  const fontSize = TYPO.pill.size * ls;
  const angle    = ((style.angle ?? 0) * Math.PI) / 180;
  const run      = labelRun(style, fontSize);

  ctx.save();
  ctx.globalAlpha = p;
  if (p < 1) ctx.filter = `blur(${(8 * (1 - p)).toFixed(2)}px)`;
  if (angle) {
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(-cx, -cy);
  }

  if (style.label3d) {
    const { depth, dx } = labelExtrusion(style, fontSize);
    drawExtrudedText(ctx, text, cx, cy, {
      color: style.color ?? preset.accent, fontSize, depth, dx, run, font: px => labelFont(style, px),
    });
    ctx.restore();
    return;
  }

  ctx.font = labelFont(style, fontSize, TYPO.pill.weight);
  const padX = PAD_X_1080 * ls;
  const padY = PAD_Y_1080 * ls;
  const dotR = fontSize * 0.2;
  const tw   = measureRun(ctx, text, run);
  const w    = tw + padX * 2 + dotR * 3;
  const h    = fontSize + padY * 2;
  const x    = cx - w / 2;
  const y    = cy - h / 2;
  const r    = Math.min(preset.cardRadius * ls, h / 2);

  ctx.shadowColor   = ELEVATION.card.shadowColor;
  ctx.shadowBlur    = ELEVATION.card.shadowBlur * ls * 0.5;
  ctx.shadowOffsetY = ELEVATION.card.shadowOffsetY * ls * 0.5;
  ctx.fillStyle     = preset.cardBg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Hairline so the tag still reads as a shape over bright/plain photo areas
  const hairlineAlpha = 0.1 * p;
  ctx.globalAlpha = hairlineAlpha;
  ctx.strokeStyle = preset.textPrimary;
  ctx.lineWidth   = ls;
  ctx.stroke();
  ctx.globalAlpha = p;

  // Accent dot ties the tag back to the preset, matching route/arrow labels
  ctx.fillStyle = style.color ?? preset.accent;
  ctx.beginPath();
  ctx.arc(x + padX + dotR, cy, dotR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle    = style.color ?? preset.textPrimary;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  fillRun(ctx, text, x + padX + dotR * 3, cy, fontSize, run);
  ctx.restore();
}
