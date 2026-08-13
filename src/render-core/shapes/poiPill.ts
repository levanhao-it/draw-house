import { POI_ICONS } from '../../design/icons';
import { TYPO, FONT_STACK, ELEVATION, SPACE } from '../../design/tokens';
import type { PoiMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

const ICON_SZ_1080 = 22;
const PAD_1080     = SPACE.sm;
const PILL_H_1080  = ICON_SZ_1080 + PAD_1080 * 2;

/** Draw a POI pill (icon + name) centred on (cx, cy). */
export function drawPoiPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  marker: PoiMarker,
  preset: Preset,
  scale: number,
): void {
  const iconSz = ICON_SZ_1080 * scale;
  const pad    = PAD_1080 * scale;
  const pillH  = PILL_H_1080 * scale;
  const r      = pillH / 2;

  const label = marker.data.dist
    ? `${marker.data.name} · ${marker.data.dist}`
    : marker.data.name;

  ctx.save();
  ctx.font = `${TYPO.pill.weight} ${TYPO.pill.size * scale}px ${FONT_STACK}`;
  const textW = ctx.measureText(label).width;
  const pillW = iconSz + pad * 3 + textW;
  const pillX = cx - pillW / 2;
  const pillY = cy - pillH / 2;

  // Background
  ctx.shadowColor   = ELEVATION.card.shadowColor;
  ctx.shadowBlur    = ELEVATION.card.shadowBlur * scale * 0.5;
  ctx.shadowOffsetY = ELEVATION.card.shadowOffsetY * scale * 0.5;
  ctx.fillStyle     = preset.cardBg;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, r);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Icon via Path2D
  const iconY = pillY + (pillH - iconSz) / 2;
  ctx.save();
  ctx.translate(pillX + pad, iconY);
  ctx.scale(iconSz / 24, iconSz / 24);
  ctx.strokeStyle = preset.accent;
  ctx.lineWidth   = 2 * (24 / iconSz);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke(new Path2D(POI_ICONS[marker.data.icon]));
  ctx.restore();

  // Text
  ctx.fillStyle    = preset.textPrimary;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillText(label, pillX + iconSz + pad * 2, pillY + pillH / 2);

  ctx.restore();
}
