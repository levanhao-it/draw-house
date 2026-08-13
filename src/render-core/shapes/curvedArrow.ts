import { bezierPoints, type Vec2 } from '../geom';
import { ARROW_OUTLINE, ELEVATION } from '../../design/tokens';
import type { Preset } from '../../design/presets';

export interface ArrowOpts {
  from: Vec2;
  ctrl: Vec2;
  to: Vec2;
  preset: Preset;
  scale: number; // frame.w / 1080
}

/** Draw a quadratic Bézier arrow with mandatory white outline + shadow (R1). */
export function drawCurvedArrow(ctx: CanvasRenderingContext2D, opts: ArrowOpts): void {
  const { from, ctrl, to, preset, scale } = opts;
  const pts     = bezierPoints(from, ctrl, to, 24);
  const strokeW = preset.arrowWidth * scale;
  const outlineW = ARROW_OUTLINE.strokeWidth * scale;
  const isDashed = preset.arrowStyle === 'dashedPin';
  const dash     = isDashed ? [(8 + preset.arrowWidth) * scale, 5 * scale] : [];

  // ---- outline pass (wider, drawn first) ----
  ctx.save();
  ctx.shadowColor   = ELEVATION.arrow.shadowColor;
  ctx.shadowBlur    = ELEVATION.arrow.shadowBlur * scale;
  ctx.shadowOffsetY = ELEVATION.arrow.shadowOffsetY * scale;
  ctx.strokeStyle   = ARROW_OUTLINE.stroke;
  ctx.lineWidth     = strokeW + outlineW;
  ctx.lineCap       = 'round';
  ctx.lineJoin      = 'round';
  if (isDashed) ctx.setLineDash(dash);
  drawPath(ctx, pts);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ---- colour pass ----
  ctx.save();
  ctx.strokeStyle = preset.accent;
  ctx.lineWidth   = strokeW;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  if (isDashed) ctx.setLineDash(dash);
  drawPath(ctx, pts);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

}

function drawPath(ctx: CanvasRenderingContext2D, pts: Vec2[]): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
}
