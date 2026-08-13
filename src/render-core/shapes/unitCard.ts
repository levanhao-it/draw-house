import { truncateFields } from '../text/truncate';
import { TYPO, FONT_STACK, ELEVATION, SPACE } from '../../design/tokens';
import { CARD_W_1080, CARD_H_1080 } from '../place';
import type { Preset } from '../../design/presets';
import type { UnitMarker } from '../../types/index';
import type { CardPlacement } from '../place';

export { CARD_W_1080, CARD_H_1080 };

const STATUS: Record<'hold' | 'sold', [string, string]> = {
  hold: ['#FF9500', 'GIỮ CHỖ'],
  sold: ['#6E6E73', 'ĐÃ BÁN'],
};

/** Returns true if any field was truncated to fit MAX_CARD_LINES. */
export function drawUnitCard(
  ctx: CanvasRenderingContext2D,
  placement: CardPlacement,
  marker: UnitMarker,
  preset: Preset,
  scale: number,
): boolean {
  const { x, y, w, h } = placement;
  const pad = SPACE.sm * scale;
  const r   = preset.cardRadius * scale;
  const { fields, truncated } = truncateFields(marker.data);

  ctx.save();
  if (marker.status === 'sold') ctx.globalAlpha = 0.65;

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

  // T2 — spec fields (area/rooms + orient/view) in textSecondary, 2-column
  const t2Order = (['area', 'rooms', 'orient', 'view'] as const).filter(k => fields[k]);
  if (t2Order.length > 0) {
    ctx.font         = `${TYPO.body.weight} ${TYPO.body.size * scale}px ${FONT_STACK}`;
    ctx.fillStyle    = preset.textSecondary;
    ctx.textBaseline = 'top';
    const colW = (tW - pad * 0.5) / 2;
    for (let i = 0; i < t2Order.length; i += 2) {
      const left  = fields[t2Order[i]!] ?? '';
      const right = t2Order[i + 1] !== undefined ? (fields[t2Order[i + 1]!] ?? '') : '';
      if (right) {
        ctx.fillText(left,  tX,          tY, colW);
        ctx.fillText(right, tX + colW + pad * 0.5, tY, colW);
      } else {
        ctx.fillText(left, tX, tY, tW);
      }
      tY += TYPO.body.size * 1.45 * scale;
    }
  }

  // T3 — price + hook band (full-width accent stripe at bottom)
  if (fields.price ?? fields.hook) {
    const bH = (TYPO.highlight.size + SPACE.xs * 1.5) * scale;
    const bY = y + h - bH - 3 * scale;
    const bX = x + barW + pad * 0.3;
    const bW = w - barW - pad * 0.6;
    const bR = r * 0.55;

    ctx.fillStyle = preset.accent;
    ctx.beginPath();
    ctx.roundRect(bX, bY, bW, bH, bR);
    ctx.fill();

    const t3 = [fields.price, fields.hook].filter(Boolean).join('  ·  ');
    ctx.fillStyle    = isLightHex(preset.accent) ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.93)';
    ctx.font         = `${TYPO.highlight.weight} ${TYPO.highlight.size * scale}px ${FONT_STACK}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(t3, bX + pad * 0.45, bY + bH / 2, bW - pad * 0.9);
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
    ctx.fillStyle    = bColor;
    ctx.beginPath();
    ctx.roundRect(bX, bYY, bW, bH, bH / 2);
    ctx.fill();
    ctx.fillStyle    = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(bText, bX + bPX, bYY + bH / 2);
  }

  ctx.restore();
  return truncated;
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
  }
  // softShadow: shadow handled by card background fill
  return 0;
}

function isLightHex(hex: string): boolean {
  if (hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
