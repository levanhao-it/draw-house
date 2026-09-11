import { POI_ICONS } from '../../design/icons';
import { getPoiIconImage } from '../../design/poiIconImages';
import { TYPO, FONT_STACK, ELEVATION, SPACE } from '../../design/tokens';
import { FULL_REVEAL, easeOutBack, type MarkerReveal } from '../animation';
import type { PoiMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

const ICON_SZ_1080 = 22;
const PAD_1080     = SPACE.sm;
const PILL_H_1080  = ICON_SZ_1080 + PAD_1080 * 2;

/** Draw a POI pill (icon + name) centred on (cx, cy). `reveal` (default: fully shown)
 *  pops the icon in with overshoot easing, then types the label out character by character. */
export function drawPoiPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  marker: PoiMarker,
  preset: Preset,
  scale: number,
  reveal: MarkerReveal = FULL_REVEAL,
): void {
  const iconSz = ICON_SZ_1080 * scale;
  const pad    = PAD_1080 * scale;
  const pillH  = PILL_H_1080 * scale;
  const r      = pillH / 2;

  const fullLabel = marker.data.dist
    ? `${marker.data.name} · ${marker.data.dist}`
    : marker.data.name;

  const { p } = reveal;
  const bgAlpha  = Math.min(1, p / 0.2);
  const iconPop  = easeOutBack(Math.min(1, p / 0.45));
  const textP    = Math.max(0, Math.min(1, (p - 0.35) / 0.65));
  const label    = fullLabel.slice(0, Math.round(fullLabel.length * textP));

  ctx.save();
  ctx.font = `${TYPO.pill.weight} ${TYPO.pill.size * scale}px ${FONT_STACK}`;
  // Sized off the FULL label so the pill doesn't resize as the text types in.
  const textW = ctx.measureText(fullLabel).width;
  const pillW = iconSz + pad * 3 + textW;
  const pillX = cx - pillW / 2;
  const pillY = cy - pillH / 2;

  // Background
  ctx.globalAlpha   = bgAlpha;
  ctx.shadowColor   = ELEVATION.card.shadowColor;
  ctx.shadowBlur    = ELEVATION.card.shadowBlur * scale * 0.5;
  ctx.shadowOffsetY = ELEVATION.card.shadowOffsetY * scale * 0.5;
  ctx.fillStyle     = preset.cardBg;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, r);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = 1;

  // Icon: custom artwork if supplied for this POI type, else the vector path
  const iconY  = pillY + (pillH - iconSz) / 2;
  const iconCx = pillX + pad + iconSz / 2;
  const iconCy = iconY + iconSz / 2;
  const iconImg = getPoiIconImage(marker.data.icon);
  if (iconImg) {
    ctx.save();
    ctx.translate(iconCx, iconCy);
    ctx.scale(iconPop, iconPop);
    ctx.drawImage(iconImg, -iconSz / 2, -iconSz / 2, iconSz, iconSz);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(iconCx, iconCy);
    ctx.scale(iconPop, iconPop);
    ctx.translate(-iconSz / 2, -iconSz / 2);
    ctx.scale(iconSz / 24, iconSz / 24);
    ctx.strokeStyle = preset.accent;
    ctx.lineWidth   = 2 * (24 / iconSz);
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke(new Path2D(POI_ICONS[marker.data.icon]));
    ctx.restore();
  }

  // Text (typewriter reveal)
  ctx.fillStyle    = preset.textPrimary;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillText(label, pillX + iconSz + pad * 2, pillY + pillH / 2);

  ctx.restore();
}
