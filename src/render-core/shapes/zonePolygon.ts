import { toPx, type Size } from '../geom';
import { TYPO, FONT_STACK, SPACE } from '../../design/tokens';
import type { ZoneMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

/** Draw a semi-transparent filled polygon with a centroid label. */
export function drawZonePolygon(
  ctx: CanvasRenderingContext2D,
  marker: ZoneMarker,
  frame: Size,
  preset: Preset,
  scale: number,
  showLabel = true,
): void {
  if (marker.path.length < 3) return;

  const pts     = marker.path.map(p => toPx(p, frame));
  const fill    = marker.data.fill    ?? preset.accent;
  const opacity = marker.data.opacity ?? 0.25;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  ctx.closePath();

  ctx.globalAlpha = opacity;
  ctx.fillStyle   = fill;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = fill;
  ctx.lineWidth   = 2 * scale;
  ctx.stroke();

  if (!showLabel || !marker.data.name) { ctx.restore(); return; }

  // Centroid label
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const label = marker.data.name;

  ctx.font = `${TYPO.legend.weight} ${TYPO.legend.size * scale}px ${FONT_STACK}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const tw = ctx.measureText(label).width;
  const lW = tw + SPACE.sm * scale * 2;
  const lH = TYPO.legend.size * scale + SPACE.xs * scale;

  ctx.fillStyle = preset.cardBg;
  ctx.beginPath();
  ctx.roundRect(cx - lW / 2, cy - lH / 2, lW, lH, 4 * scale);
  ctx.fill();

  ctx.fillStyle = preset.textPrimary;
  ctx.fillText(label, cx, cy);

  ctx.restore();
}
