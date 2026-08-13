import { describe, it, expect } from 'vitest';
import { assertProject, canExport, resolveDisplayMode } from './invariants';
import type { Project, UnitMarker } from './index';
import { DEFAULT_DISCLAIMER } from './index';

function makeProject(overrides?: Partial<Project>): Project {
  const base: Project = {
    version: 1,
    id: 'p1',
    name: 'Test Project',
    updatedAt: Date.now(),
    disclaimer: DEFAULT_DISCLAIMER,
    brandKit: {
      logoCorner: 'tr',
      hotline: '0901234567',
      watermark: { enabled: false, opacity: 0.1 },
    },
    scene: {
      image: { id: 'img1', kind: 'perspective', w: 1920, h: 1080, displaySrc: '', originalSrc: '' },
      ratio: '4:5',
      preset: 'neon_spotlight',
      displayMode: 'auto',
      compass: { show: false, deg: 0 },
      scaleBar: { show: false, metersPerPx: 1 },
      markers: [],
    },
  };
  return { ...base, ...overrides };
}

function makeUnit(id: string, order: number, x = 0.5, y = 0.5): UnitMarker {
  return {
    id,
    type: 'UNIT',
    order,
    layout: { auto: true, cardAnchor: null, arrowCtrl: null },
    point: { x, y },
    radius: 0.05,
    status: 'available',
    data: { code: id },
  };
}

describe('assertProject invariants', () => {
  it('I1: valid normalised points pass', () => {
    const p = makeProject();
    p.scene.markers = [makeUnit('u1', 1, 0.0, 1.0)];
    expect(() => assertProject(p)).not.toThrow();
  });

  it('I1: point x > 1 throws', () => {
    const p = makeProject();
    p.scene.markers = [makeUnit('u1', 1, 1.5, 0.5)];
    expect(() => assertProject(p)).toThrow('[I1]');
  });

  it('I2: RouteMarker with < 2 path points throws', () => {
    const p = makeProject();
    p.scene.markers = [{
      id: 'r1', type: 'ROUTE', order: 1,
      layout: { auto: true, cardAnchor: null, arrowCtrl: null },
      path: [{ x: 0.5, y: 0.5 }],
      data: { name: 'Route', style: 'solid' },
    }];
    expect(() => assertProject(p)).toThrow('[I2]');
  });

  it('I2: ZoneMarker with < 3 path points throws', () => {
    const p = makeProject();
    p.scene.markers = [{
      id: 'z1', type: 'ZONE', order: 1,
      layout: { auto: true, cardAnchor: null, arrowCtrl: null },
      path: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }],
      data: { name: 'Zone' },
    }];
    expect(() => assertProject(p)).toThrow('[I2]');
  });

  it('I3: UnitMarker with blank code throws', () => {
    const p = makeProject();
    const u = makeUnit('u1', 1);
    u.data.code = '   ';
    p.scene.markers = [u];
    expect(() => assertProject(p)).toThrow('[I3]');
  });

  it('I4: duplicate orders throw', () => {
    const p = makeProject();
    p.scene.markers = [makeUnit('u1', 1), makeUnit('u2', 1)];
    expect(() => assertProject(p)).toThrow('[I4]');
  });

  it('I4: gap in order sequence throws', () => {
    const p = makeProject();
    p.scene.markers = [makeUnit('u1', 1), makeUnit('u2', 3)];
    expect(() => assertProject(p)).toThrow('[I4]');
  });

  it('I5: empty disclaimer throws', () => {
    const p = makeProject({ disclaimer: '' });
    expect(() => assertProject(p)).toThrow('[I5]');
  });

  it('I6: canExport is false when hotline is empty', () => {
    const p = makeProject();
    p.brandKit.hotline = '';
    expect(canExport(p)).toBe(false);
  });

  it('I9: resolveDisplayMode returns legend when UNIT count > 3', () => {
    const markers = [
      makeUnit('u1', 1), makeUnit('u2', 2), makeUnit('u3', 3), makeUnit('u4', 4),
    ];
    expect(resolveDisplayMode(markers)).toBe('legend');
  });
});
