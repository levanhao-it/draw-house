// La bàn (F19) + hướng nắng/gió — manual-angle overlay, no real geodata available.
import { FONT_STACK, ELEVATION } from '../../design/tokens';
import { BRAND_BAND_HEIGHT_1080 } from './brandLayer';
import type { CompassSettings } from '../../types/index';
import type { Size } from '../geom';

const R_1080         = 58;
const NORTH_LEN_1080  = 40;
const AUX_LEN_1080    = 30; // sun/wind needles a bit shorter than North — less overlap at the tips
const HEAD_LEN_1080   = 13;
const HEAD_WID_1080   = 11;
const TIP_BADGE_R_1080 = 11;
const TIP_GAP_1080    = 9;

const NORTH_COLOR = '#FF3B30'; // universal compass red, independent of preset
const SUN_COLOR   = '#FFB020';
const WIND_COLOR  = '#29B6C6';

function cornerCenter(corner: CompassSettings['corner'], frame: Size, r: number, pad: number, s: number) {
  // Bottom corners need extra clearance so the badge (+ its needle reach) never overlaps the
  // mandatory brand/disclaimer band that always renders along the very bottom of the frame.
  const bottomClearance = BRAND_BAND_HEIGHT_1080 * s;
  return {
    x: corner === 'tl' || corner === 'bl' ? pad + r : frame.w - pad - r,
    y: corner === 'tl' || corner === 'tr' ? pad + r : frame.h - pad - r - bottomClearance,
  };
}

/** deg: clockwise from straight up (0 = up, 90 = right, 180 = down, 270 = left). */
function dirVec(deg: number): { dx: number; dy: number } {
  const rad = (deg * Math.PI) / 180;
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
}

/** Small round chip (white disc + colour ring) holding a single glyph/emoji — the same
 *  "pill label" treatment used for route/POI/text labels elsewhere, just circular since the
 *  content here is always one character wide. */
function drawTipBadge(
  ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, glyph: string,
): void {
  const r = TIP_BADGE_R_1080 * scale;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 5 * scale;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `700 ${13 * scale}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x, y + 0.5 * scale);
  ctx.restore();
}

/** Needle: a short shaft plus a proper arrowhead (white outline + colour fill, matching the
 *  app's existing ARROW visual language) instead of a bare line — reads as a real pointer
 *  instead of a stray line. Ends in a round glyph badge just past the tip. */
function drawNeedle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, deg: number, len: number, scale: number,
  color: string, glyph: string,
): void {
  const { dx, dy } = dirVec(deg);
  const perp = { x: -dy, y: dx };
  const headLen = HEAD_LEN_1080 * scale, headWid = HEAD_WID_1080 * scale;
  const tip = { x: cx + dx * len, y: cy + dy * len };
  const shaftEnd = { x: tip.x - dx * headLen, y: tip.y - dy * headLen };

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(shaftEnd.x, shaftEnd.y);
  ctx.stroke();

  function triangle(hl: number, hw: number) {
    const base = { x: tip.x - dx * hl, y: tip.y - dy * hl };
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(base.x + perp.x * hw / 2, base.y + perp.y * hw / 2);
    ctx.lineTo(base.x - perp.x * hw / 2, base.y - perp.y * hw / 2);
    ctx.closePath();
  }
  ctx.fillStyle = '#FFFFFF';
  triangle(headLen + 2 * scale, headWid + 3 * scale);
  ctx.fill();
  ctx.fillStyle = color;
  triangle(headLen, headWid);
  ctx.fill();
  ctx.restore();

  const gap = TIP_GAP_1080 * scale;
  drawTipBadge(ctx, tip.x + dx * gap, tip.y + dy * gap, scale, color, glyph);
}

/** Compass rose badge with a mandatory North needle, plus optional sun/wind needles sharing
 *  the same centre — all angles are set manually by the sale (no geodata for the photo). */
export function drawCompass(
  ctx: CanvasRenderingContext2D,
  frame: Size,
  compass: CompassSettings,
): void {
  if (!compass.show) return;
  const s   = frame.w / 1080;
  const r   = R_1080 * s;
  const pad = 22 * s;
  const { x: cx, y: cy } = cornerCenter(compass.corner, frame, r, pad, s);

  ctx.save();
  ctx.shadowColor = ELEVATION.card.shadowColor;
  ctx.shadowBlur = ELEVATION.card.shadowBlur * s * 0.6;
  ctx.shadowOffsetY = ELEVATION.card.shadowOffsetY * s * 0.5;
  ctx.fillStyle = 'rgba(20,20,24,0.55)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2 * s;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (compass.showWind) drawNeedle(ctx, cx, cy, compass.windDeg, AUX_LEN_1080 * s, s, WIND_COLOR, 'G');
  if (compass.showSun)  drawNeedle(ctx, cx, cy, compass.sunDeg, AUX_LEN_1080 * s, s, SUN_COLOR, 'N');
  drawNeedle(ctx, cx, cy, compass.northDeg, NORTH_LEN_1080 * s, s, NORTH_COLOR, 'B');

  // Centre hub — a small dot ties all needles back to one shared pivot point.
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
