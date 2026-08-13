import { toPx, type Size } from '../geom';
import { TYPO, FONT_STACK, ELEVATION, SPACE } from '../../design/tokens';
import type { RouteMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

/** Draw a route polyline with a direction-aware label on the longest segment. */
export function drawRouteLine(
  ctx: CanvasRenderingContext2D,
  marker: RouteMarker,
  frame: Size,
  preset: Preset,
  scale: number,
  showLabel = true,
): void {
  if (marker.path.length < 2) return;

  const pts    = marker.path.map(p => toPx(p, frame));
  const color  = marker.data.color ?? preset.accent;
  const lineW  = Math.max(3, preset.arrowWidth * 0.45) * scale;
  const outlineW = 3 * scale;
  const isDashed = marker.data.style === 'dashed';
  const dash   = isDashed ? [10 * scale, 6 * scale] : [];

  function tracePath() {
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  }

  // ---- outline pass ----
  ctx.save();
  ctx.strokeStyle   = 'rgba(255,255,255,0.85)';
  ctx.lineWidth     = lineW + outlineW;
  ctx.lineCap       = 'round';
  ctx.lineJoin      = 'round';
  ctx.shadowColor   = ELEVATION.arrow.shadowColor;
  ctx.shadowBlur    = ELEVATION.arrow.shadowBlur * scale;
  ctx.shadowOffsetY = ELEVATION.arrow.shadowOffsetY * scale;
  if (isDashed) ctx.setLineDash(dash);
  tracePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ---- colour pass ----
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineW;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  if (isDashed) ctx.setLineDash(dash);
  tracePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  if (!showLabel || !marker.data.name) return;

  // Find the longest segment for label placement
  let maxLen = 0, segIdx = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1]!.x - pts[i]!.x, pts[i + 1]!.y - pts[i]!.y);
    if (d > maxLen) { maxLen = d; segIdx = i; }
  }

  const p0 = pts[segIdx]!;
  const p1 = pts[segIdx + 1]!;
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;

  // Keep angle in (−90°, 90°] — text never upside-down (spec: route label never lộn ngược)
  let angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;

  const fontSize = TYPO.routeLabel.size * scale;
  ctx.font = `${TYPO.routeLabel.weight} ${fontSize}px ${FONT_STACK}`;
  const tw  = ctx.measureText(marker.data.name).width;
  const padX = SPACE.xs * scale * 1.4;
  const padY = SPACE.xs * scale * 0.7;
  const lW  = tw + padX * 2 + fontSize * 0.9; // room for colour dot
  const lH  = fontSize + padY * 2;
  const liftY = lineW / 2 + lH * 0.6 + 2 * scale; // float just above the line

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);

  // Background pill
  ctx.shadowColor  = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur   = 6 * scale;
  ctx.fillStyle    = preset.cardBg;
  ctx.globalAlpha  = 0.93;
  ctx.beginPath();
  ctx.roundRect(-lW / 2, -liftY - lH, lW, lH, lH / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowColor = 'transparent';

  // Colour dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(-lW / 2 + padX + fontSize * 0.22, -liftY - lH / 2, fontSize * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Label text
  ctx.fillStyle    = preset.textPrimary;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(marker.data.name, -lW / 2 + padX + fontSize * 0.6, -liftY - lH / 2);

  ctx.restore();
}
