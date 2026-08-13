// Card placement heuristic — 8 candidate quadrants, pick first non-overlapping fit
import { toPx, type Size, type Rect } from './geom';
import type { NormPoint, Marker, UnitMarker } from '../types/index';

/** Card dimensions in the 1080-wide coordinate space. */
export const CARD_W_1080 = 320;
export const CARD_H_1080 = 190;

export function cardSize(scale: number): { w: number; h: number } {
  return { w: CARD_W_1080 * scale, h: CARD_H_1080 * scale };
}

export interface CardPlacement {
  x: number; y: number;
  w: number; h: number;
}

// Ordered by visual preference: diagonals first (avoids blocking content), then orthogonal
const QUADRANTS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 1, dy: -1 },  // top-right
  { dx: -1, dy: -1 }, // top-left
  { dx: 1, dy: 1 },   // bottom-right
  { dx: -1, dy: 1 },  // bottom-left
  { dx: 1, dy: 0 },   // right
  { dx: -1, dy: 0 },  // left
  { dx: 0, dy: -1 },  // top
  { dx: 0, dy: 1 },   // bottom
];

const GAP_RATIO = 0.055; // gap as fraction of frame diagonal

function rectOverlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Pick the best available position for a card given the marker point.
 * Tries 8 quadrants and returns the first that fits within the frame
 * and does not overlap any already-placed rects.
 */
export function placeCard(
  point: NormPoint,
  cardW: number,
  cardH: number,
  frame: Size,
  existingRects: Rect[],
): CardPlacement {
  const px = toPx(point, frame);
  const gap = GAP_RATIO * Math.hypot(frame.w, frame.h);

  for (const q of QUADRANTS) {
    let cx: number, cy: number;

    if (q.dx !== 0 && q.dy !== 0) {
      cx = q.dx > 0 ? px.x + gap : px.x - gap - cardW;
      cy = q.dy > 0 ? px.y + gap : px.y - gap - cardH;
    } else if (q.dx !== 0) {
      cx = q.dx > 0 ? px.x + gap : px.x - gap - cardW;
      cy = px.y - cardH / 2;
    } else {
      cx = px.x - cardW / 2;
      cy = q.dy > 0 ? px.y + gap : px.y - gap - cardH;
    }

    // Must fit entirely within frame
    if (cx < 0 || cy < 0 || cx + cardW > frame.w || cy + cardH > frame.h) continue;

    const candidate: Rect = { x: cx, y: cy, w: cardW, h: cardH };
    if (!existingRects.some(r => rectOverlaps(candidate, r))) {
      return candidate;
    }
  }

  // Fallback: clamp top-right into frame
  const fx = Math.max(0, Math.min(px.x + gap, frame.w - cardW));
  const fy = Math.max(0, Math.min(px.y - cardH - gap, frame.h - cardH));
  return { x: fx, y: fy, w: cardW, h: cardH };
}

/**
 * Compute all UNIT card rects for the current frame, respecting manual cardAnchor overrides.
 * Used for drag hit-testing in StageCanvas (pure, no rendering).
 */
export function getCardPlacements(markers: Marker[], frame: Size): Map<string, Rect> {
  const result = new Map<string, Rect>();
  const placed: Rect[] = [];

  for (const m of markers) {
    if (m.type !== 'UNIT') continue;
    const unit = m as UnitMarker;
    const effectiveScale = (frame.w / 1080) * (unit.layout.cardScale ?? 1);
    const { w: cardW, h: cardH } = cardSize(effectiveScale);
    let x: number, y: number;
    if (!unit.layout.auto && unit.layout.cardAnchor) {
      const p = toPx(unit.layout.cardAnchor, frame);
      x = p.x; y = p.y;
    } else {
      const cp = placeCard(unit.point, cardW, cardH, frame, placed);
      x = cp.x; y = cp.y;
    }
    const rect: Rect = { x, y, w: cardW, h: cardH };
    placed.push(rect);
    result.set(m.id, rect);
  }
  return result;
}
