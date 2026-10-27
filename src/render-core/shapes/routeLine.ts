import { toPx, pathLength, pathPrefix, type Size } from '../geom';
import { TYPO, ELEVATION, SPACE } from '../../design/tokens';
import { FULL_REVEAL, type MarkerReveal } from '../animation';
import { drawExtrudedText } from '../text/extrudedText';
import { labelFont, labelText, labelRun, labelExtrusion } from '../text/labelStyle';
import { measureRun, fillRun } from '../text/run';
import type { RouteMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

/** Share of the sweep over which the name fades in once the line has reached it. */
const LABEL_FADE = 0.35;

/** Draw a route polyline with a direction-aware label on the longest segment.
 *  While `reveal` (default: fully shown) runs, the line grows from its first point to its last
 *  and the label fades in once the line has reached it — never ahead of the line. */
export function drawRouteLine(
  ctx: CanvasRenderingContext2D,
  marker: RouteMarker,
  frame: Size,
  preset: Preset,
  scale: number,
  showLabel = true,
  reveal: MarkerReveal = FULL_REVEAL,
): void {
  if (marker.path.length < 2) return;
  const { p } = reveal;
  // A zero-length stroke with a round cap still paints a dot, so draw nothing until the line starts.
  if (p <= 0) return;

  const pts    = marker.path.map(pt => toPx(pt, frame));
  const total  = pathLength(pts);
  const drawn  = p < 1 ? pathPrefix(pts, total * p) : pts;
  const color  = marker.data.color ?? preset.accent;
  const lineW  = Math.max(3, preset.arrowWidth * 0.45) * scale;
  const outlineW = 3 * scale;
  const isDashed = marker.data.style === 'dashed';
  const dash   = isDashed ? [10 * scale, 6 * scale] : [];

  function tracePath() {
    ctx.beginPath();
    ctx.moveTo(drawn[0]!.x, drawn[0]!.y);
    for (let i = 1; i < drawn.length; i++) ctx.lineTo(drawn[i]!.x, drawn[i]!.y);
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

  // The longest segment hosts the label; `labelAt` is how far down the route its middle sits
  let maxLen = 0, segIdx = 0, labelAt = 0, walked = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1]!.x - pts[i]!.x, pts[i + 1]!.y - pts[i]!.y);
    if (d > maxLen) { maxLen = d; segIdx = i; labelAt = walked + d / 2; }
    walked += d;
  }

  // Fades in as the line reaches the label, and is fully shown by the time the line lands
  const fadeStart  = Math.min(total > 0 ? labelAt / total : 0, 1 - LABEL_FADE);
  const labelAlpha = p >= 1 ? 1 : Math.min(1, Math.max(0, (p - fadeStart) / LABEL_FADE));
  if (labelAlpha <= 0) return;

  const p0 = pts[segIdx]!;
  const p1 = pts[segIdx + 1]!;
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;

  // Keep angle in (−90°, 90°] — text never upside-down (spec: route label never lộn ngược)
  let angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;

  // Label-local scale: the user's size multiplier, so padding and shadow stay in proportion to the text.
  const ls = scale * (marker.data.labelScale ?? 1);
  const fontSize = TYPO.routeLabel.size * ls;
  const name = labelText(marker.data.name, marker.data);
  const run  = labelRun(marker.data, fontSize);

  if (marker.data.label3d) {
    ctx.save();
    ctx.globalAlpha = labelAlpha;
    ctx.translate(mx, my);
    ctx.rotate(angle);
    const { depth, dx } = labelExtrusion(marker.data, fontSize);
    // Float above the line, with the extrusion and its shadow clear of it
    const cy = -(lineW / 2 + 3 * ls + depth + fontSize * 0.6);
    drawExtrudedText(ctx, name, 0, cy, { color, fontSize, depth, dx, run, font: px => labelFont(marker.data, px) });
    ctx.restore();
    return;
  }

  ctx.font = labelFont(marker.data, fontSize, TYPO.routeLabel.weight);
  const tw  = measureRun(ctx, name, run);
  const padX = SPACE.xs * ls * 1.4;
  const padY = SPACE.xs * ls * 0.7;
  const lW  = tw + padX * 2 + fontSize * 0.9; // room for colour dot
  const lH  = fontSize + padY * 2;
  const liftY = lineW / 2 + lH * 0.6 + 2 * ls; // float just above the line

  ctx.save();
  ctx.globalAlpha = labelAlpha;
  ctx.translate(mx, my);
  ctx.rotate(angle);

  // Background pill
  ctx.shadowColor  = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur   = 6 * ls;
  ctx.fillStyle    = preset.cardBg;
  ctx.globalAlpha  = 0.93 * labelAlpha;
  ctx.beginPath();
  ctx.roundRect(-lW / 2, -liftY - lH, lW, lH, lH / 2);
  ctx.fill();
  ctx.globalAlpha = labelAlpha;
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
  fillRun(ctx, name, -lW / 2 + padX + fontSize * 0.6, -liftY - lH / 2, fontSize, run);

  ctx.restore();
}
