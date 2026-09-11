import { TYPO, FONT_STACK, ELEVATION, SPACE } from '../../design/tokens';
import type { TextMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

const PAD_X_1080 = SPACE.sm * 1.2;
const PAD_Y_1080 = SPACE.xs * 1.3;

/** Draw a freestanding text label (no icon) centred on (cx, cy), styled off the active preset. */
export function drawTextTag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  marker: TextMarker,
  preset: Preset,
  scale: number,
): void {
  const text = marker.data.text.trim();
  if (!text) return;

  const fontSize = TYPO.pill.size * scale;
  ctx.font = `${TYPO.pill.weight} ${fontSize}px ${FONT_STACK}`;
  const padX = PAD_X_1080 * scale;
  const padY = PAD_Y_1080 * scale;
  const dotR = fontSize * 0.2;
  const tw   = ctx.measureText(text).width;
  const w    = tw + padX * 2 + dotR * 3;
  const h    = fontSize + padY * 2;
  const x    = cx - w / 2;
  const y    = cy - h / 2;
  const r    = Math.min(preset.cardRadius * scale, h / 2);

  ctx.save();
  ctx.shadowColor   = ELEVATION.card.shadowColor;
  ctx.shadowBlur    = ELEVATION.card.shadowBlur * scale * 0.5;
  ctx.shadowOffsetY = ELEVATION.card.shadowOffsetY * scale * 0.5;
  ctx.fillStyle     = preset.cardBg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Hairline so the tag still reads as a shape over bright/plain photo areas
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = preset.textPrimary;
  ctx.lineWidth   = scale;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Accent dot ties the tag back to the preset, matching route/arrow labels
  ctx.fillStyle = preset.accent;
  ctx.beginPath();
  ctx.arc(x + padX + dotR, cy, dotR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle    = preset.textPrimary;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX + dotR * 3, cy);
  ctx.restore();
}
