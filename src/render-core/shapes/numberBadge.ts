import { FONT_STACK, ELEVATION, ARROW_OUTLINE, TYPO } from '../../design/tokens';
import type { Preset } from '../../design/presets';

/** R1: circular order badge with mandatory white outline + drop-shadow. */
export function drawNumberBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  order: number,
  preset: Preset,
  scale: number,
): void {
  ctx.save();

  ctx.shadowColor    = ELEVATION.arrow.shadowColor;
  ctx.shadowBlur     = ELEVATION.arrow.shadowBlur * scale;
  ctx.shadowOffsetY  = ELEVATION.arrow.shadowOffsetY * scale;

  ctx.fillStyle   = preset.accent;
  ctx.strokeStyle = ARROW_OUTLINE.stroke;
  ctx.lineWidth   = ARROW_OUTLINE.strokeWidth * scale;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle    = isLight(preset.accent) ? '#000000' : '#FFFFFF';
  ctx.font         = `${TYPO.badge.weight} ${Math.round(r * 1.1)}px ${FONT_STACK}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(order), cx, cy);

  ctx.restore();
}

function isLight(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}
