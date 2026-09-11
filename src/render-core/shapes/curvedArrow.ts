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

/** Draw a quadratic Bézier arrow with mandatory white outline + shadow + arrowhead (R1). */
export function drawCurvedArrow(ctx: CanvasRenderingContext2D, opts: ArrowOpts): void {
  const { from, ctrl, to, preset, scale } = opts;
  const pts     = bezierPoints(from, ctrl, to, 24);
  const strokeW = preset.arrowWidth * scale;
  const outlineW = ARROW_OUTLINE.strokeWidth * scale;
  const isDashed = preset.arrowStyle === 'dashedPin';
  const dash     = isDashed ? [(8 + preset.arrowWidth) * scale, 5 * scale] : [];

  // Tangent direction at the tip, from the last two sampled curve points
  const tail = pts[pts.length - 2] ?? from;
  const tdx = to.x - tail.x, tdy = to.y - tail.y;
  const tdist = Math.hypot(tdx, tdy) || 1;
  const dir  = { x: tdx / tdist, y: tdy / tdist };
  const headLen = strokeW * 2.4 + outlineW;
  const headWid = strokeW * 1.9 + outlineW;

  // Stop the stroked line at the arrowhead's base, not the tip — otherwise its
  // round line-cap pokes out past the point and the tip looks blunt/lumpy.
  const lineEnd = { x: to.x - dir.x * headLen, y: to.y - dir.y * headLen };
  const linePts = pts.filter(p => Math.hypot(p.x - to.x, p.y - to.y) > headLen);
  linePts.push(lineEnd);

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
  drawPath(ctx, linePts);
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
  drawPath(ctx, linePts);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ---- arrowhead: white halo + accent fill, sized off the line's own width ----
  ctx.save();
  ctx.shadowColor   = ELEVATION.arrow.shadowColor;
  ctx.shadowBlur    = ELEVATION.arrow.shadowBlur * scale;
  ctx.shadowOffsetY = ELEVATION.arrow.shadowOffsetY * scale;
  traceTriangle(ctx, to, dir, headLen + outlineW, headWid + outlineW * 1.6);
  ctx.fillStyle = ARROW_OUTLINE.stroke;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  traceTriangle(ctx, to, dir, headLen, headWid);
  ctx.fillStyle = preset.accent;
  ctx.fill();
  ctx.restore();
}

/** Isosceles triangle pointing along `dir`, tip at `p`. */
function traceTriangle(ctx: CanvasRenderingContext2D, p: Vec2, dir: Vec2, len: number, wid: number): void {
  const perp = { x: -dir.y, y: dir.x };
  const base = { x: p.x - dir.x * len, y: p.y - dir.y * len };
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(base.x + perp.x * wid / 2, base.y + perp.y * wid / 2);
  ctx.lineTo(base.x - perp.x * wid / 2, base.y - perp.y * wid / 2);
  ctx.closePath();
}

function drawPath(ctx: CanvasRenderingContext2D, pts: Vec2[]): void {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
}
