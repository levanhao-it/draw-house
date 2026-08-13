import { placeCard, cardSize, type CardPlacement } from '../place';
import { drawUnitCard } from '../shapes/unitCard';
import { drawCurvedArrow } from '../shapes/curvedArrow';
import { drawNumberBadge } from '../shapes/numberBadge';
import { drawPoiPill } from '../shapes/poiPill';
import { drawRouteLine } from '../shapes/routeLine';
import { drawZonePolygon } from '../shapes/zonePolygon';
import { toPx, type Size, type Rect } from '../geom';
import { resolveDisplayMode, drawLegend } from './legendLayer';
import type { Marker, UnitMarker, PoiMarker, RouteMarker, ZoneMarker, DisplayMode } from '../../types/index';
import type { Preset } from '../../design/presets';

const BADGE_R_1080 = 22;

/** Draw all markers. Returns array of marker IDs where card content was truncated. */
export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: Marker[],
  frame: Size,
  preset: Preset,
  displayMode: DisplayMode = 'auto',
): string[] {
  if (markers.length === 0) return [];

  const scale  = frame.w / 1080;
  const mode   = displayMode === 'auto' ? resolveDisplayMode(markers) : displayMode;
  const truncatedIds: string[] = [];

  // Always render geometric features (routes, zones)
  for (const m of markers) {
    if (m.type === 'ROUTE') drawRouteLine(ctx, m as RouteMarker, frame, preset, scale, mode === 'callout');
    if (m.type === 'ZONE')  drawZonePolygon(ctx, m as ZoneMarker, frame, preset, scale, mode === 'callout');
  }

  if (mode === 'callout') {
    // POI pills
    for (const m of markers) {
      if (m.type === 'POI') {
        const px = toPx((m as PoiMarker).point, frame);
        drawPoiPill(ctx, px.x, px.y, m as PoiMarker, preset, scale);
      }
    }

    // UNIT callout cards + arrows
    const placedRects: Rect[] = [];
    const unitMarkers = markers.filter((m): m is UnitMarker => m.type === 'UNIT');

    for (const m of unitMarkers) {
      const markerPx      = toPx(m.point, frame);
      const shortEdge     = Math.min(frame.w, frame.h);
      const r             = m.radius * shortEdge;
      const effectiveScale = scale * (m.layout.cardScale ?? 1);
      const { w: cardW, h: cardH } = cardSize(effectiveScale);

      const placement: CardPlacement = (() => {
        if (!m.layout.auto && m.layout.cardAnchor) {
          const p = toPx(m.layout.cardAnchor, frame);
          return { x: p.x, y: p.y, w: cardW, h: cardH };
        }
        return placeCard(m.point, cardW, cardH, frame, placedRects);
      })();
      placedRects.push({ x: placement.x, y: placement.y, w: cardW, h: cardH });

      const wasTruncated = drawUnitCard(ctx, placement, m, preset, effectiveScale);
      if (wasTruncated) truncatedIds.push(m.id);

      const cardCx = placement.x + cardW / 2;
      const cardCy = placement.y + cardH / 2;
      const dx     = markerPx.x - cardCx;
      const dy     = markerPx.y - cardCy;
      const dist   = Math.hypot(dx, dy) || 1;

      const hw = cardW / 2, hh = cardH / 2;
      const tx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
      const ty = dy !== 0 ? hh / Math.abs(dy) : Infinity;
      const t  = Math.min(tx, ty);
      const from  = { x: cardCx + dx * t, y: cardCy + dy * t };
      const to    = { x: markerPx.x - (dx / dist) * r * 1.05, y: markerPx.y - (dy / dist) * r * 1.05 };
      const mid   = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      const h     = preset.arrowCurve * dist;
      // Pick the perpendicular direction that curves toward canvas centre (avoids cutting through image edge)
      const perpA = { x: mid.x + (-dy / dist) * h, y: mid.y + (dx / dist) * h };
      const perpB = { x: mid.x + (dy / dist) * h,  y: mid.y + (-dx / dist) * h };
      const cx    = frame.w / 2, cy = frame.h / 2;
      const ctrl  = Math.hypot(perpA.x - cx, perpA.y - cy) < Math.hypot(perpB.x - cx, perpB.y - cy)
        ? perpA : perpB;
      drawCurvedArrow(ctx, { from, ctrl, to, preset, scale });
    }
  } else {
    // Legend mode: draw numbered badges at each marker's point/centroid
    const badgeR = BADGE_R_1080 * scale;
    for (const m of markers) {
      const { bx, by } = badgeCenter(m, frame);
      drawNumberBadge(ctx, bx, by, badgeR, m.order, preset, scale);
    }
    drawLegend(ctx, markers, frame, preset, scale);
  }

  return truncatedIds;
}

function badgeCenter(m: Marker, frame: Size): { bx: number; by: number } {
  if (m.type === 'UNIT' || m.type === 'POI') {
    const p = toPx((m as UnitMarker | PoiMarker).point, frame);
    return { bx: p.x, by: p.y };
  }
  if (m.type === 'ROUTE') {
    const pts = (m as RouteMarker).path.map(p => toPx(p, frame));
    const mid = Math.floor(pts.length / 2);
    return { bx: pts[mid]!.x, by: pts[mid]!.y };
  }
  // ZONE: centroid
  const pts = (m as ZoneMarker).path.map(p => toPx(p, frame));
  return {
    bx: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    by: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}
