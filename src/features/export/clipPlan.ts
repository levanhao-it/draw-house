// Pure schedule for the animated (video/GIF) export — shared by the export hook and the panel's length preview.
import type { Marker, MarkerType } from '../../types/index';
import { computeSequentialTimings, type MarkerTiming } from '../../render-core/animation';

const DEFAULT_FADE_IN_SEC = 0.5;
// ZONE's outline-trace + fill looked too fast at the default pace; routes and arrows sweep from start to end, quicker than the rest.
const FADE_IN_SEC_BY_TYPE: Partial<Record<MarkerType, number>> = { ZONE: 1.3, ROUTE: 0.3, ARROW: 0.3 };

const LEAD_IN_SEC     = 0.5; // bare photo before the first marker appears
export const ENDING_IN_SEC = 1; // QR/hotline card pop-in
const ENDING_HOLD_SEC = 2.5; // card stays fully shown this long
const MIN_CLIP_SEC    = 2;

export interface ClipPlan {
  /** Reveal order: everything by `order`, but units (căn hộ) always last. */
  sorted: Marker[];
  /** Parallel to `sorted`. */
  timings: MarkerTiming[];
  endingStartSec: number;
  durationSec: number;
}

/** One marker at a time, each shown alone for `holdSec` after it lands; total length follows the content. */
export function planClip(markers: readonly Marker[], holdSec: number, hasEndingCard: boolean): ClipPlan {
  const sorted = [...markers].sort((a, b) => {
    const aUnit = a.type === 'UNIT' ? 1 : 0;
    const bUnit = b.type === 'UNIT' ? 1 : 0;
    return aUnit !== bUnit ? aUnit - bUnit : a.order - b.order;
  });
  const { timings, endSec } = computeSequentialTimings(
    sorted.map(m => FADE_IN_SEC_BY_TYPE[m.type] ?? DEFAULT_FADE_IN_SEC),
    holdSec,
    LEAD_IN_SEC,
  );
  const endingSec = hasEndingCard ? ENDING_IN_SEC + ENDING_HOLD_SEC : 0;
  return { sorted, timings, endingStartSec: endSec, durationSec: Math.max(MIN_CLIP_SEC, endSec + endingSec) };
}
