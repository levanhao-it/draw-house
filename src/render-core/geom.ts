// render-core/geom.ts — geometry helpers; pure functions, no DOM/state access

import type { NormPoint } from '../types/index';

export interface Vec2 { x: number; y: number }
export interface Size { w: number; h: number }
export interface Rect { x: number; y: number; w: number; h: number }

/** Convert normalised point (0..1) to pixel coordinates within a frame. */
export function toPx(p: NormPoint, frame: Size): Vec2 {
  return { x: p.x * frame.w, y: p.y * frame.h };
}

/** Convert pixel coordinates back to normalised (0..1) within a frame. */
export function toNorm(v: Vec2, frame: Size): NormPoint {
  return { x: v.x / frame.w, y: v.y / frame.h };
}

/**
 * CSS `object-fit: cover` placement: scale image to fully cover the frame,
 * centred. Returns draw offset (x, y) and uniform scale factor.
 */
export function coverRect(img: Size, frame: Size): { x: number; y: number; scale: number } {
  const scale = Math.max(frame.w / img.w, frame.h / img.h);
  return {
    x: (frame.w - img.w * scale) / 2,
    y: (frame.h - img.h * scale) / 2,
    scale,
  };
}

/**
 * Clamp rect so it remains within bounds.
 * When rect is larger than bounds along an axis, it stays centred on that axis.
 */
export function clampRect(rect: Rect, bounds: Rect): Rect {
  const maxX = bounds.x + bounds.w - rect.w;
  const maxY = bounds.y + bounds.h - rect.h;
  return {
    ...rect,
    x: Math.min(Math.max(rect.x, bounds.x), maxX),
    y: Math.min(Math.max(rect.y, bounds.y), maxY),
  };
}

/** Returns true when two axis-aligned rects overlap (touching edges = false). */
export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Sample `seg+1` evenly-spaced points along a quadratic Bézier P0→ctrl→P2.
 * Both endpoints are included. Default seg=20.
 */
export function bezierPoints(p0: Vec2, ctrl: Vec2, p2: Vec2, seg = 20): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * p0.x + 2 * mt * t * ctrl.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * ctrl.y + t * t * p2.y,
    });
  }
  return pts;
}
