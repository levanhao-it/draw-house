import { describe, it, expect } from 'vitest';
import { toPx, toNorm, coverRect, clampRect, overlaps, bezierPoints } from './geom';

describe('toPx / toNorm round-trip', () => {
  it('error < 1e-6 for arbitrary values', () => {
    const frame = { w: 1080, h: 1920 };
    const p = { x: 0.3, y: 0.75 };
    const restored = toNorm(toPx(p, frame), frame);
    expect(Math.abs(restored.x - p.x)).toBeLessThan(1e-6);
    expect(Math.abs(restored.y - p.y)).toBeLessThan(1e-6);
  });

  it('preserves edge values 0 and 1', () => {
    const frame = { w: 500, h: 800 };
    expect(toNorm(toPx({ x: 0, y: 0 }, frame), frame)).toEqual({ x: 0, y: 0 });
    expect(toNorm(toPx({ x: 1, y: 1 }, frame), frame)).toEqual({ x: 1, y: 1 });
  });
});

describe('coverRect', () => {
  it('portrait image on portrait frame covers fully', () => {
    const img = { w: 1000, h: 1500 };
    const frame = { w: 1080, h: 1920 };
    const { scale, x, y } = coverRect(img, frame);
    expect(img.w * scale).toBeGreaterThanOrEqual(frame.w - 0.01);
    expect(img.h * scale).toBeGreaterThanOrEqual(frame.h - 0.01);
    // image is wider than frame after scale → x ≤ 0
    expect(x).toBeLessThanOrEqual(0.01);
    expect(y).toBeGreaterThanOrEqual(-0.01);
  });

  it('landscape image on portrait frame covers fully', () => {
    const img = { w: 4032, h: 3024 };
    const frame = { w: 1080, h: 1920 };
    const { scale, x } = coverRect(img, frame);
    expect(img.w * scale).toBeGreaterThanOrEqual(frame.w - 0.01);
    expect(img.h * scale).toBeGreaterThanOrEqual(frame.h - 0.01);
    expect(x).toBeLessThanOrEqual(0); // wider → overflows horizontally
  });

  it('landscape image on landscape frame covers fully', () => {
    const img = { w: 1920, h: 1080 };
    const frame = { w: 1280, h: 720 };
    const { scale } = coverRect(img, frame);
    expect(img.w * scale).toBeGreaterThanOrEqual(frame.w - 0.01);
    expect(img.h * scale).toBeGreaterThanOrEqual(frame.h - 0.01);
  });

  it('square image on square frame → scale = frame/img', () => {
    const { scale } = coverRect({ w: 500, h: 500 }, { w: 1080, h: 1080 });
    expect(scale).toBeCloseTo(1080 / 500, 10);
  });
});

describe('clampRect', () => {
  const bounds = { x: 0, y: 0, w: 1080, h: 1920 };

  it('clamps negative origin to zero', () => {
    const r = clampRect({ x: -10, y: -20, w: 200, h: 100 }, bounds);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });

  it('clamps rect that overflows right/bottom edge', () => {
    const r = clampRect({ x: 1000, y: 1900, w: 200, h: 100 }, bounds);
    expect(r.x).toBe(880); // 1080 - 200
    expect(r.y).toBe(1820); // 1920 - 100
  });

  it('does not move a rect already fully inside bounds', () => {
    const rect = { x: 100, y: 100, w: 200, h: 100 };
    expect(clampRect(rect, bounds)).toEqual(rect);
  });
});

describe('overlaps', () => {
  it('intersecting rects → true', () => {
    expect(overlaps({ x: 0, y: 0, w: 100, h: 100 }, { x: 50, y: 50, w: 100, h: 100 })).toBe(true);
  });

  it('touching edges only → false', () => {
    expect(overlaps({ x: 0, y: 0, w: 100, h: 100 }, { x: 100, y: 0, w: 100, h: 100 })).toBe(false);
  });

  it('clearly separated → false', () => {
    expect(overlaps({ x: 0, y: 0, w: 50, h: 50 }, { x: 200, y: 200, w: 50, h: 50 })).toBe(false);
  });

  it('one rect fully inside another → true', () => {
    expect(overlaps({ x: 0, y: 0, w: 400, h: 400 }, { x: 100, y: 100, w: 50, h: 50 })).toBe(true);
  });
});

describe('bezierPoints', () => {
  it('returns seg+1 points', () => {
    const pts = bezierPoints({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }, 20);
    expect(pts).toHaveLength(21);
  });

  it('first point equals P0 and last equals P2', () => {
    const p0 = { x: 10, y: 20 };
    const p2 = { x: 90, y: 80 };
    const pts = bezierPoints(p0, { x: 50, y: 0 }, p2);
    const last = pts[pts.length - 1];
    expect(pts[0]).toEqual(p0);
    expect(last?.x).toBeCloseTo(p2.x, 10);
    expect(last?.y).toBeCloseTo(p2.y, 10);
  });

  it('control point at midpoint on x-axis → all y ≈ 0 (straight line)', () => {
    const pts = bezierPoints({ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, 4);
    pts.forEach(pt => expect(pt.y).toBeCloseTo(0, 10));
  });

  it('default seg=20 produces 21 points', () => {
    const pts = bezierPoints({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 });
    expect(pts).toHaveLength(21);
  });
});
