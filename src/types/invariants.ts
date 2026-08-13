import {
  type Project,
  type Marker,
  type UnitMarker,
  type RouteMarker,
  type ZoneMarker,
  LEGEND_THRESHOLD,
} from './index';

class InvariantError extends Error {
  constructor(inv: string, detail: string) {
    super(`[${inv}] ${detail}`);
    this.name = 'InvariantError';
  }
}

// I1: every x,y ∈ [0,1]
function checkI1(markers: Marker[]): void {
  for (const m of markers) {
    if (m.type === 'UNIT' || m.type === 'POI') {
      const { x, y } = (m as UnitMarker).point;
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        throw new InvariantError('I1', `Marker ${m.id} point out of [0,1]: (${x}, ${y})`);
      }
    } else {
      for (const p of (m as RouteMarker | ZoneMarker).path) {
        if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
          throw new InvariantError('I1', `Marker ${m.id} path point out of [0,1]: (${p.x}, ${p.y})`);
        }
      }
    }
  }
}

// I2: path length constraints
function checkI2(markers: Marker[]): void {
  for (const m of markers) {
    if (m.type === 'ROUTE' && (m as RouteMarker).path.length < 2) {
      throw new InvariantError('I2', `RouteMarker ${m.id} requires ≥2 path points`);
    }
    if (m.type === 'ZONE' && (m as ZoneMarker).path.length < 3) {
      throw new InvariantError('I2', `ZoneMarker ${m.id} requires ≥3 path points`);
    }
  }
}

// I3: unit code non-empty
function checkI3(markers: Marker[]): void {
  for (const m of markers) {
    if (m.type === 'UNIT' && !(m as UnitMarker).data.code.trim()) {
      throw new InvariantError('I3', `UnitMarker ${m.id} code is empty`);
    }
  }
}

// I4: order is 1..n, continuous, no duplicates
function checkI4(markers: Marker[]): void {
  const orders = markers.map(m => m.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      throw new InvariantError(
        'I4',
        `marker.order must be 1..${markers.length} continuous; got ${JSON.stringify(orders)}`,
      );
    }
  }
}

// I5: disclaimer non-empty
function checkI5(project: Project): void {
  if (!project.disclaimer.trim()) {
    throw new InvariantError('I5', 'project.disclaimer must not be empty');
  }
}

export function assertProject(project: Project): void {
  const { markers } = project.scene;
  checkI1(markers);
  checkI2(markers);
  checkI3(markers);
  checkI4(markers);
  checkI5(project);
}

/** I6 — missing hotline blocks export. */
export function canExport(project: Project): boolean {
  return project.brandKit.hotline.trim().length > 0;
}

/** I9 — resolves the effective display mode from marker counts. */
export function resolveDisplayMode(markers: Marker[]): 'callout' | 'legend' {
  const units = markers.filter(m => m.type === 'UNIT').length;
  if (units > LEGEND_THRESHOLD.maxUnitCallout) return 'legend';
  if (markers.length > LEGEND_THRESHOLD.maxTotalCallout) return 'legend';
  return 'callout';
}
