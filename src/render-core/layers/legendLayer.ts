import { TYPO, FONT_STACK, SPACE } from '../../design/tokens';
import { LEGEND_THRESHOLD } from '../../types/index';
import type { Marker, UnitMarker, PoiMarker, RouteMarker, ZoneMarker } from '../../types/index';
import type { Size } from '../geom';
import type { Preset } from '../../design/presets';
import { drawNumberBadge } from '../shapes/numberBadge';
import { BRAND_BAND_HEIGHT_1080 } from './brandLayer';
import { vi } from '../../i18n/vi';

export function resolveDisplayMode(markers: Marker[]): 'callout' | 'legend' {
  const units = markers.filter(m => m.type === 'UNIT').length;
  if (units > LEGEND_THRESHOLD.maxUnitCallout) return 'legend';
  if (markers.length > LEGEND_THRESHOLD.maxTotalCallout) return 'legend';
  return 'callout';
}

const ROW_H_1080  = 44;
const TITLE_H_1080 = ROW_H_1080;
const PAD_1080    = SPACE.sm;
const BADGE_R_1080 = 12;

/** Draw the legend box above the brand footer. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  markers: Marker[],
  frame: Size,
  preset: Preset,
  scale: number,
): void {
  if (markers.length === 0) return;

  const brandH  = BRAND_BAND_HEIGHT_1080 * scale;
  const rowH    = ROW_H_1080 * scale;
  const titleH  = TITLE_H_1080 * scale;
  const padX    = PAD_1080 * scale;
  const padY    = PAD_1080 * scale;
  const badgeR  = BADGE_R_1080 * scale;
  const maxH    = frame.h * 0.30;

  // Determine column count
  const neededH1 = padY + titleH + markers.length * rowH + padY;
  const twoCol   = neededH1 > maxH;
  const cols     = twoCol ? 2 : 1;
  const perCol   = Math.ceil(markers.length / cols);
  const boxH     = Math.min(padY + titleH + perCol * rowH + padY, maxH);
  const boxY     = frame.h - brandH - boxH;

  ctx.save();

  // Background
  ctx.globalAlpha = 0.95;
  ctx.fillStyle   = preset.cardBg;
  ctx.fillRect(0, boxY, frame.w, boxH);
  ctx.globalAlpha = 1;

  // Top accent separator
  ctx.strokeStyle = preset.accent;
  ctx.lineWidth   = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(0, boxY);
  ctx.lineTo(frame.w, boxY);
  ctx.stroke();

  // Title
  ctx.fillStyle    = preset.accent;
  ctx.font         = `700 ${TYPO.legend.size * scale}px ${FONT_STACK}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillText(vi.legend.title, padX, boxY + padY + titleH / 2);

  // Relative-distance note (R9) when any POI has a dist value
  const hasDist = markers.some(m => m.type === 'POI' && (m as PoiMarker).data.dist);
  if (hasDist) {
    ctx.fillStyle = preset.textSecondary;
    ctx.font      = `400 ${TYPO.disclaimer.size * scale}px ${FONT_STACK}`;
    const note    = vi.legend.relativeDist;
    ctx.textAlign = 'right';
    ctx.fillText(note, frame.w - padX, boxY + padY + titleH / 2);
  }

  const colW = frame.w / cols;

  markers.forEach((m, i) => {
    const col = twoCol ? (i >= perCol ? 1 : 0) : 0;
    const row = twoCol ? i % perCol : i;
    const x   = col * colW + padX;
    const y   = boxY + padY + titleH + row * rowH;

    // Clamp to box bottom
    if (y + rowH > boxY + boxH) return;

    drawNumberBadge(ctx, x + badgeR, y + rowH / 2, badgeR, m.order, preset, scale);

    ctx.fillStyle    = preset.textPrimary;
    ctx.font         = `${TYPO.legend.weight} ${TYPO.legend.size * scale}px ${FONT_STACK}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    ctx.fillText(
      markerLegendText(m),
      x + badgeR * 2 + padX,
      y + rowH / 2,
      colW - badgeR * 2 - padX * 2,
    );
  });

  ctx.restore();
}

function markerLegendText(m: Marker): string {
  switch (m.type) {
    case 'UNIT': {
      const u = m as UnitMarker;
      const parts = [u.data.code];
      if (u.data.area)  parts.push(u.data.area);
      if (u.data.price) parts.push(u.data.price);
      return parts.join(' · ');
    }
    case 'POI': {
      const p = m as PoiMarker;
      return p.data.dist ? `${p.data.name} (${p.data.dist})` : p.data.name;
    }
    case 'ROUTE': return (m as RouteMarker).data.name;
    case 'ZONE':  return (m as ZoneMarker).data.name;
  }
}
