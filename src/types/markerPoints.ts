import type { Marker, NormPoint } from './index';

/** Identifies which individual point on a marker is being referenced/edited. */
export type PointRef =
  | { kind: 'point' }
  | { kind: 'from' }
  | { kind: 'to' }
  | { kind: 'path'; index: number };

/** All individually-draggable points on a marker, in a stable order. One function
 *  covers every marker type so editors don't need per-type drag code. */
export function getMarkerPoints(m: Marker): Array<{ ref: PointRef; pos: NormPoint }> {
  switch (m.type) {
    case 'UNIT':
    case 'POI':
    case 'TEXT':
      return [{ ref: { kind: 'point' }, pos: m.point }];
    case 'ARROW':
      return [{ ref: { kind: 'from' }, pos: m.from }, { ref: { kind: 'to' }, pos: m.to }];
    case 'ROUTE':
    case 'ZONE':
      return m.path.map((pos, index) => ({ ref: { kind: 'path', index }, pos }));
  }
}

/** Returns a copy of `m` with the point at `ref` replaced by `pos`. */
export function withMarkerPoint(m: Marker, ref: PointRef, pos: NormPoint): Marker {
  if (ref.kind === 'point' && (m.type === 'UNIT' || m.type === 'POI' || m.type === 'TEXT')) {
    return { ...m, point: pos };
  }
  if (ref.kind === 'from' && m.type === 'ARROW') return { ...m, from: pos };
  if (ref.kind === 'to' && m.type === 'ARROW') return { ...m, to: pos };
  if (ref.kind === 'path' && (m.type === 'ROUTE' || m.type === 'ZONE')) {
    const path = m.path.slice();
    path[ref.index] = pos;
    return { ...m, path };
  }
  return m;
}
