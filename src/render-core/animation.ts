// Pure timeline math for the animated (video/GIF) export — no canvas/DOM here (G-2).
import type { NormPoint } from '../types/index';

/** Per-marker entrance state at a given moment: `p` drives alpha/slide/scale/dash-trace
 *  amount (clamped 0..1, stays at 1 once landed); `sinceLandedSec` is how long ago (in
 *  seconds) `p` reached 1 — negative before landing — for one-shot post-landing pulses
 *  (spotlight flash, price highlight) that can't be expressed by `p` alone since it stops
 *  changing once landed. */
export interface MarkerReveal { p: number; sinceLandedSec: number }

/** A marker that's always fully shown (no animation) — the default for non-animated render paths. */
export const FULL_REVEAL: MarkerReveal = { p: 1, sinceLandedSec: Infinity };

export interface MarkerTiming { startSec: number; fadeInSec: number }

/**
 * Stagger `total` markers' entrance start times (in `order` sequence) across the first
 * `revealSpanFrac` fraction of the clip, each fading in over `fadeInSec`.
 */
export function computeMarkerTimings(
  total: number,
  durationSec: number,
  revealSpanFrac = 0.6,
  fadeInSec = 0.5,
): MarkerTiming[] {
  if (total <= 0) return [];
  const span = durationSec * revealSpanFrac;
  return Array.from({ length: total }, (_, i) => ({
    startSec: total <= 1 ? 0 : (i / total) * span,
    fadeInSec,
  }));
}

/** Resolve a marker's reveal state at `elapsedSec` into the clip. */
export function markerReveal(timing: MarkerTiming, elapsedSec: number): MarkerReveal {
  const localSec = elapsedSec - timing.startSec;
  const p = Math.max(0, Math.min(1, localSec / timing.fadeInSec));
  return { p, sinceLandedSec: localSec - timing.fadeInSec };
}

/**
 * A short one-shot pulse of intensity 1→0, starting `delaySec` after landing and lasting
 * `lengthSec` — used for the price-line highlight and spotlight flash. Returns 0 outside
 * that window (including before landing, since `sinceLandedSec` is negative then).
 */
export function landedPulse(sinceLandedSec: number, delaySec: number, lengthSec: number): number {
  const local = sinceLandedSec - delaySec;
  if (local < 0 || local > lengthSec) return 0;
  return 1 - local / lengthSec;
}

/** Standard "back out" overshoot easing (easings.net) — overshoots past 1 then settles. */
export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Cubic ease-out — fast start, smooth settle, no overshoot. */
export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export interface KenBurnsRect { sx: number; sy: number; sw: number; sh: number }

/**
 * Smoothed zoom+pan crop rect (in source-canvas pixel space) at normalised timeline
 * position `t` (0..1). Zooms from 1x (full frame) toward `zoom` centred progressively on
 * `target` (normalised point), clamped to stay within the source bounds. Returns the
 * full, unzoomed frame when `target` is null (nothing to Ken-Burns toward).
 */
export function kenBurnsRect(
  t: number,
  srcW: number,
  srcH: number,
  target: NormPoint | null,
  zoom = 1.12,
): KenBurnsRect {
  if (!target) return { sx: 0, sy: 0, sw: srcW, sh: srcH };

  const ease = t * t * (3 - 2 * t); // smoothstep — slow start/end, no sudden zoom
  const z    = 1 + (zoom - 1) * ease;
  const sw   = srcW / z;
  const sh   = srcH / z;
  const tx   = target.x * srcW;
  const ty   = target.y * srcH;

  const sx = Math.max(0, Math.min(srcW - sw, tx - sw / 2));
  const sy = Math.max(0, Math.min(srcH - sh, ty - sh / 2));
  return { sx, sy, sw, sh };
}
