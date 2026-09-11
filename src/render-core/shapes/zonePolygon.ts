import { toPx, pathLength, type Size } from '../geom';
import { TYPO, FONT_STACK, SPACE, ELEVATION } from '../../design/tokens';
import { FULL_REVEAL, type MarkerReveal } from '../animation';
import type { ZoneMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

/** Draw a filled polygon (perspective depth-fade fill + glowing edge) with a centroid label.
 *  `reveal` (default: fully shown) traces the outline in via a dash-offset animation, then
 *  fades the fill in behind it — used by the animated (video/GIF) export. */
export function drawZonePolygon(
  ctx: CanvasRenderingContext2D,
  marker: ZoneMarker,
  frame: Size,
  preset: Preset,
  scale: number,
  showLabel = true,
  reveal: MarkerReveal = FULL_REVEAL,
): void {
  if (marker.path.length < 3) return;

  const pts     = marker.path.map(p => toPx(p, frame));
  const fill    = marker.data.fill    ?? preset.accent;
  const opacity = marker.data.opacity ?? 0.25;
  const { p } = reveal;
  // Outline traces during the first 55% of this marker's own reveal; fill fades in
  // starting a bit before the outline finishes, so the two blend instead of stepping.
  const outlineP = Math.min(1, p / 0.55);
  const fillP    = Math.max(0, Math.min(1, (p - 0.35) / 0.65));

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  ctx.closePath();

  // Depth-fade fill: lighter toward the top edge (farther away on a perspective ground plane),
  // fuller opacity toward the bottom (nearer camera) — reads as a plane lying on the ground
  // instead of a flat sticker pasted over the photo.
  const minY = Math.min(...pts.map(p2 => p2.y));
  const maxY = Math.max(...pts.map(p2 => p2.y));
  const grad = ctx.createLinearGradient(0, minY, 0, maxY > minY ? maxY : minY + 1);
  grad.addColorStop(0, hexToRgba(fill, opacity * 0.4 * fillP));
  grad.addColorStop(1, hexToRgba(fill, opacity * fillP));
  ctx.fillStyle = grad;
  ctx.fill();

  // Glowing edge: white halo underneath (keeps the rim legible on any photo background),
  // then the accent colour on top with a blurred shadow for the actual neon glow.
  if (outlineP < 1) {
    const total = pathLength(pts, true);
    ctx.setLineDash([total, total]);
    ctx.lineDashOffset = total * (1 - outlineP);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth   = 3.5 * scale;
  ctx.stroke();

  ctx.strokeStyle = fill;
  ctx.lineWidth   = 2 * scale;
  ctx.shadowColor = ELEVATION.glow(fill).shadowColor;
  ctx.shadowBlur  = ELEVATION.glow(fill).shadowBlur * scale;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.setLineDash([]);

  if (!showLabel || !marker.data.name || fillP <= 0) { ctx.restore(); return; }

  // Centroid label
  const cx = pts.reduce((s, p2) => s + p2.x, 0) / pts.length;
  const cy = pts.reduce((s, p2) => s + p2.y, 0) / pts.length;
  const label = marker.data.name;

  ctx.font = `${TYPO.legend.weight} ${TYPO.legend.size * scale}px ${FONT_STACK}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const tw = ctx.measureText(label).width;
  const lW = tw + SPACE.sm * scale * 2;
  const lH = TYPO.legend.size * scale + SPACE.xs * scale;

  ctx.globalAlpha = fillP;
  ctx.fillStyle = preset.cardBg;
  ctx.beginPath();
  ctx.roundRect(cx - lW / 2, cy - lH / 2, lW, lH, 4 * scale);
  ctx.fill();

  ctx.fillStyle = preset.textPrimary;
  ctx.fillText(label, cx, cy);

  ctx.restore();
}

/** #RGB/#RRGGBB → `rgba(...)` string at the given alpha; falls back to the accent colour verbatim. */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex;
  const h = hex.slice(1);
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
