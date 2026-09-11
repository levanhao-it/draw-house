import { truncateFields } from '../text/truncate';
import { formatPriceDisplay } from '../text/formatPrice';
import { wrapText } from '../text/wrap';
import { TYPO, FONT_STACK, ELEVATION, SPACE, CARD_W_1080, CARD_W_1080_MAX } from '../../design/tokens';
import { FIELD_ICONS, type FieldIconKey } from '../../design/icons';
import { FULL_REVEAL, easeOutCubic, landedPulse, type MarkerReveal } from '../animation';
import type { Preset } from '../../design/presets';
import type { UnitMarker } from '../../types/index';
import type { CardPlacement } from '../place';

const STATUS: Record<'hold' | 'sold', [string, string]> = {
  hold: ['#FF9500', 'GIỮ CHỖ'],
  sold: ['#6E6E73', 'ĐÃ BÁN'],
};

// Same icon treatment everywhere a spec field appears (T2 rows + T3 band) for a uniform look.
const FIELD_ICON_SZ_1080   = 13;
const FIELD_ICON_CHIP_MULT = 1.7; // chip (soft circular backdrop) diameter relative to icon size
const FIELD_ICON_GAP_1080  = 5;

/** Returns true if any field was truncated to fit MAX_CARD_LINES. `reveal` (default: fully
 *  shown) slides the card up + scales it in (0.9→1), plus a brief highlight flash on the
 *  price band shortly after landing — used by the animated (video/GIF) export. */
export function drawUnitCard(
  ctx: CanvasRenderingContext2D,
  placement: CardPlacement,
  marker: UnitMarker,
  preset: Preset,
  scale: number,
  reveal: MarkerReveal = FULL_REVEAL,
): boolean {
  const { x, y, w, h } = placement;
  const pad = SPACE.sm * scale;
  const r   = preset.cardRadius * scale;
  const { fields, truncated } = truncateFields(marker.data);

  const ease = easeOutCubic(reveal.p);
  const priceHighlight = landedPulse(reveal.sinceLandedSec, 0.2, 0.35);

  ctx.save();
  // Slide up from below + pop from 0.9→1 scale, both around the card's own centre.
  const ccx = x + w / 2, ccy = y + h / 2;
  ctx.translate(ccx, ccy);
  ctx.scale(0.9 + 0.1 * ease, 0.9 + 0.1 * ease);
  ctx.translate(-ccx, -ccy);
  ctx.translate(0, (1 - ease) * 40 * scale);
  ctx.globalAlpha = marker.status === 'sold' ? 0.65 * ease : ease;

  // ── background + drop shadow ──────────────────────────────
  ctx.shadowColor   = ELEVATION.card.shadowColor;
  ctx.shadowBlur    = ELEVATION.card.shadowBlur * scale;
  ctx.shadowOffsetY = ELEVATION.card.shadowOffsetY * scale;
  ctx.fillStyle     = preset.cardBg;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // ── edge decoration ───────────────────────────────────────
  const barW = drawEdge(ctx, preset, x, y, w, h, r, scale);

  // ── text area origin ──────────────────────────────────────
  const tX = x + barW + pad;
  const tW = w - barW - pad * 1.5;
  let   tY = y + pad * 0.8;

  // T1 — unit code (large, accent, bold)
  ctx.font         = `${TYPO.code.weight} ${TYPO.code.size * scale}px ${FONT_STACK}`;
  ctx.fillStyle    = preset.accent;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';
  // Leave right portion for status badge
  const codeMaxW = marker.status !== 'available' ? tW * 0.72 : tW;
  ctx.fillText(fields.code ?? marker.data.code, tX, tY, codeMaxW);
  tY += TYPO.code.size * scale * 1.05;

  // thin accent separator
  ctx.save();
  ctx.strokeStyle = preset.accent;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth   = scale;
  ctx.beginPath();
  ctx.moveTo(tX, tY);
  ctx.lineTo(x + w - pad * 0.8, tY);
  ctx.stroke();
  ctx.restore();
  tY += 5 * scale;

  // T2 — spec fields (area/rooms + orient/view + loan/capital) in textSecondary, 2-column
  const t2Order = (['area', 'rooms', 'orient', 'view', 'loan', 'capital'] as const).filter(k => fields[k]);
  if (t2Order.length > 0) {
    ctx.font         = `${TYPO.body.weight} ${TYPO.body.size * scale}px ${FONT_STACK}`;
    ctx.fillStyle    = preset.textSecondary;
    ctx.textBaseline = 'top';
    const colW      = (tW - pad * 0.5) / 2;
    const iconSz    = FIELD_ICON_SZ_1080 * scale;
    const chipD     = iconSz * FIELD_ICON_CHIP_MULT;
    const iconInset = chipD + FIELD_ICON_GAP_1080 * scale;
    const iconCy    = (lineY: number) => lineY + TYPO.body.size * scale * 0.5;
    const lineH     = TYPO.body.size * 1.45 * scale;
    for (let i = 0; i < t2Order.length; i += 2) {
      const leftKey  = t2Order[i]!;
      const rightKey = t2Order[i + 1];
      const cy = iconCy(tY);
      drawFieldIcon(ctx, leftKey, tX + chipD / 2, cy, iconSz, preset.textSecondary);
      let rowLines: number;
      if (rightKey !== undefined) {
        const rightX = tX + colW + pad * 0.5;
        const leftLines = drawWrappedField(ctx, fields[leftKey] ?? '', tX + iconInset, tY, colW - iconInset, lineH);
        drawFieldIcon(ctx, rightKey, rightX + chipD / 2, cy, iconSz, preset.textSecondary);
        const rightLines = drawWrappedField(ctx, fields[rightKey] ?? '', rightX + iconInset, tY, colW - iconInset, lineH);
        rowLines = Math.max(leftLines, rightLines);
      } else {
        rowLines = drawWrappedField(ctx, fields[leftKey] ?? '', tX + iconInset, tY, tW - iconInset, lineH);
      }
      tY += rowLines * lineH;
    }
  }

  // T3 — price + hook band (full-width accent stripe at bottom)
  if (fields.price ?? fields.hook) {
    const bH = (TYPO.highlight.size + SPACE.xs * 2) * scale;
    const bY = y + h - bH - 3 * scale;
    const bX = x + barW + pad * 0.3;
    const bW = w - barW - pad * 0.6;
    const bR = r * 0.55;
    const insetX = pad * 0.75; // breathing room between the pill edge and its content

    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,.28)';
    ctx.shadowBlur    = 8 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.fillStyle     = preset.accent;
    ctx.beginPath();
    ctx.roundRect(bX, bY, bW, bH, bR);
    ctx.fill();
    ctx.restore();

    // "Dòng giá highlight sau 0.2s": a brief white flash right after the card lands
    if (priceHighlight > 0) {
      ctx.save();
      ctx.globalAlpha = priceHighlight * 0.55;
      ctx.fillStyle   = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, bR);
      ctx.fill();
      ctx.restore();
    }

    const t3Color = isLightHex(preset.accent) ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.93)';
    const t3Parts: Array<{ key: FieldIconKey; text: string }> = [];
    if (fields.price) t3Parts.push({ key: 'price', text: formatPriceDisplay(fields.price) });
    if (fields.hook)  t3Parts.push({ key: 'hook',  text: fields.hook });

    ctx.font         = `${TYPO.highlight.weight} ${TYPO.highlight.size * scale}px ${FONT_STACK}`;
    ctx.fillStyle    = t3Color;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';

    const iconSz  = FIELD_ICON_SZ_1080 * scale;
    const chipD   = iconSz * FIELD_ICON_CHIP_MULT;
    const iconGap = FIELD_ICON_GAP_1080 * scale;
    const dotW    = ctx.measureText('·').width;

    // Measure the unconstrained width first so a long price+hook combo shrinks
    // together as one block instead of the later part clipping to nothing.
    let naturalW = 0;
    t3Parts.forEach((part, i) => {
      if (i > 0) naturalW += dotW + iconGap;
      naturalW += chipD + iconGap * 0.6 + ctx.measureText(part.text).width + iconGap;
    });
    const availW     = bW - insetX * 2;
    const contentScale = naturalW > availW ? availW / naturalW : 1;

    ctx.save();
    ctx.translate(bX + insetX, bY + bH / 2);
    ctx.scale(contentScale, 1);
    let curX = 0;
    t3Parts.forEach((part, i) => {
      if (i > 0) {
        ctx.fillText('·', curX, 0);
        curX += dotW + iconGap;
      }
      drawFieldIcon(ctx, part.key, curX + chipD / 2, 0, iconSz, t3Color);
      curX += chipD + iconGap * 0.6;
      ctx.fillText(part.text, curX, 0);
      curX += ctx.measureText(part.text).width + iconGap;
    });
    ctx.restore();
  }

  // ── status badge (hold / sold) ────────────────────────────
  if (marker.status !== 'available') {
    const [bColor, bText] = STATUS[marker.status];
    const bFont = 11 * scale;
    ctx.font = `700 ${bFont}px ${FONT_STACK}`;
    const bTW = ctx.measureText(bText).width;
    const bPX = 5 * scale, bPY = 3 * scale;
    const bW  = bTW + bPX * 2;
    const bH  = bFont + bPY * 2;
    const bX  = x + w - bW - pad * 0.45;
    const bYY = y + pad * 0.55;
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,.35)';
    ctx.shadowBlur    = 6 * scale;
    ctx.shadowOffsetY = 1.5 * scale;
    ctx.fillStyle     = bColor;
    ctx.beginPath();
    ctx.roundRect(bX, bYY, bW, bH, bH / 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle    = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(bText, bX + bPX, bYY + bH / 2);
  }

  ctx.restore();
  return truncated;
}

/**
 * Natural (unwrapped) card width needed to fit this marker's content on one line per row,
 * clamped to [CARD_W_1080, CARD_W_1080_MAX] * scale. Mirrors drawUnitCard's own layout math
 * (same constants, same formulas) so measurement and rendering never drift apart.
 */
export function measureCardWidth(
  marker: UnitMarker,
  preset: Preset,
  ctx: CanvasRenderingContext2D,
  scale: number,
): number {
  const pad  = SPACE.sm * scale;
  const barW = preset.cardEdge === 'accentBar' ? 8 * scale : 0;
  const { fields } = truncateFields(marker.data);

  // T1 — code (+ status badge reserve, mirrors the badge block below)
  ctx.font = `${TYPO.code.weight} ${TYPO.code.size * scale}px ${FONT_STACK}`;
  const codeW = ctx.measureText(fields.code ?? marker.data.code).width;
  let badgeReserve = 0;
  if (marker.status !== 'available') {
    const [, bText] = STATUS[marker.status];
    ctx.font = `700 ${11 * scale}px ${FONT_STACK}`;
    badgeReserve = ctx.measureText(bText).width + 5 * scale * 2 + pad * 0.45;
  }

  // T2 — widest row, unwrapped (columns are forced equal-width, so use the wider field twice)
  const t2Order = (['area', 'rooms', 'orient', 'view', 'loan', 'capital'] as const).filter(k => fields[k]);
  ctx.font        = `${TYPO.body.weight} ${TYPO.body.size * scale}px ${FONT_STACK}`;
  const iconSz    = FIELD_ICON_SZ_1080 * scale;
  const chipD     = iconSz * FIELD_ICON_CHIP_MULT;
  const iconInset = chipD + FIELD_ICON_GAP_1080 * scale;
  let neededT2 = 0;
  for (let i = 0; i < t2Order.length; i += 2) {
    const leftW    = ctx.measureText(fields[t2Order[i]!] ?? '').width;
    const rightKey = t2Order[i + 1];
    const rowNeeded = rightKey !== undefined
      ? 2 * (iconInset + Math.max(leftW, ctx.measureText(fields[rightKey] ?? '').width)) + pad * 0.5
      : iconInset + leftW;
    neededT2 = Math.max(neededT2, rowNeeded);
  }

  let neededW = Math.max(codeW + badgeReserve, neededT2) + barW + pad * 1.5;

  // T3 — price + hook, natural (unshrunk) width
  if (fields.price ?? fields.hook) {
    ctx.font = `${TYPO.highlight.weight} ${TYPO.highlight.size * scale}px ${FONT_STACK}`;
    const iconGap = FIELD_ICON_GAP_1080 * scale;
    const dotW    = ctx.measureText('·').width;
    const parts: string[] = [];
    if (fields.price) parts.push(formatPriceDisplay(fields.price));
    if (fields.hook)  parts.push(fields.hook);
    let naturalW = 0;
    parts.forEach((text, i) => {
      if (i > 0) naturalW += dotW + iconGap;
      naturalW += chipD + iconGap * 0.6 + ctx.measureText(text).width + iconGap;
    });
    const insetX = pad * 0.75;
    neededW = Math.max(neededW, naturalW + insetX * 2 + barW + pad * 0.6);
  }

  return Math.min(CARD_W_1080_MAX * scale, Math.max(CARD_W_1080 * scale, neededW));
}

const MAX_FIELD_LINES     = 2;    // wrap long T2 values instead of squishing; hard-cap so a card can't grow unbounded
const SQUISH_TOLERANCE_PX = 1.15; // allow a barely-there squish (<=15% over) rather than wrapping borderline text

/** Draws `text` wrapped to fit `maxWidth`, capped at MAX_FIELD_LINES (ellipsis on the last line if longer). Returns lines drawn. */
function drawWrappedField(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number,
  lineH: number,
): number {
  // Only slightly over? A tiny native squish is less disruptive than an extra line.
  if (ctx.measureText(text).width <= maxWidth * SQUISH_TOLERANCE_PX) {
    ctx.fillText(text, x, y, maxWidth);
    return 1;
  }
  const lines = wrapText(ctx, text, maxWidth);
  const shown = lines.length > MAX_FIELD_LINES ? lines.slice(0, MAX_FIELD_LINES) : lines;
  if (lines.length > MAX_FIELD_LINES) {
    // More text was cut off than fits — mark it, even if the shown line alone would fit unmodified.
    shown[MAX_FIELD_LINES - 1] = forceEllipsis(ctx, shown[MAX_FIELD_LINES - 1]!, maxWidth);
  }
  shown.forEach((line, i) => ctx.fillText(line, x, y + i * lineH));
  return shown.length;
}

function forceEllipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text + '…').width <= maxWidth) return text + '…';
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo) + '…';
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  preset: Preset,
  x: number, y: number, w: number, h: number, r: number, scale: number,
): number {
  if (preset.cardEdge === 'accentBar') {
    const bw = 8 * scale;
    ctx.fillStyle = preset.accent;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, h, [r, 0, 0, r]);
    ctx.fill();
    return bw;
  }
  if (preset.cardEdge === 'goldBorder') {
    ctx.strokeStyle = preset.accent;
    ctx.lineWidth   = 1.5 * scale;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
  } else if (preset.cardEdge === 'grayBorder') {
    ctx.strokeStyle = '#DADCE0';
    ctx.lineWidth   = scale;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
  } else if (preset.cardEdge === 'softShadow') {
    // Hairline so the card reads as a distinct shape against busy photo backgrounds
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = preset.textPrimary;
    ctx.lineWidth   = scale;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }
  return 0;
}

function isLightHex(hex: string): boolean {
  if (hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}

function drawFieldIcon(
  ctx: CanvasRenderingContext2D,
  key: FieldIconKey,
  cx: number, cy: number, size: number, color: string,
): void {
  const def   = FIELD_ICONS[key];
  const chipR = (size * FIELD_ICON_CHIP_MULT) / 2;

  ctx.save();
  ctx.fillStyle   = color;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(cx, cy, chipR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle   = color;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.2 * (24 / size);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  if (def.stroke) ctx.stroke(new Path2D(def.stroke));
  if (def.fill)   ctx.fill(new Path2D(def.fill));
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
