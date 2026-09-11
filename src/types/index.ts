// TypeScript types and constants — docs/02-DATA-MODEL.md §1–§2

/** Normalised coordinate 0..1 relative to the EXPORT FRAME. Never pixels. */
export interface NormPoint { x: number; y: number }

export type Ratio = '4:5' | '9:16' | '16:9' | '1:1';
export type PresetId = 'neon_spotlight' | 'minimal_white' | 'luxe_gold_black' | 'map_clean' | 'black_white';
export type ImageKind = 'perspective' | 'floorplan' | 'map';
export type DisplayMode = 'auto' | 'callout' | 'legend';
export type SpotlightMode = 'normal' | 'spotlight';
export type UnitStatus = 'available' | 'hold' | 'sold';

/** User-adjustable spotlight look (sale muốn "vùng sáng vào đúng căn, tối phần còn lại").
 *  `dimAlpha: null` means "use the active preset's own dimAlpha" until explicitly overridden. */
export interface SpotlightSettings {
  dimAlpha: number | null; // 0..1 — how dark the surrounding background gets
  softness: number;        // 0..1.5 — edge feather size, as a fraction of the unit's radius
  intensity: number;       // 0..1 — how fully lit the spotlight centre is
}

// Matches the original hardcoded look exactly (feather was a fixed 1.6x radius i.e.
// softness=0.6, erase was always fully opaque i.e. intensity=1).
export const DEFAULT_SPOTLIGHT_SETTINGS: SpotlightSettings = {
  dimAlpha: null,
  softness: 0.6,
  intensity: 1,
};

export type OverlayCorner = 'tl' | 'tr' | 'bl' | 'br';

/** Compass rose overlay (F19) — North is manual (no real geodata), sale kéo lệch theo ảnh.
 *  Sun/wind are optional extra needles on the same rose ("hướng nắng/gió"). Degrees are
 *  clockwise from straight up (0 = up, 90 = right, 180 = down, 270 = left). */
export interface CompassSettings {
  show: boolean;
  corner: OverlayCorner;
  northDeg: number;
  showSun: boolean;
  sunDeg: number;
  showWind: boolean;
  windDeg: number;
}

export const DEFAULT_COMPASS: CompassSettings = {
  show: false,
  corner: 'tl',
  northDeg: 0,
  showSun: false,
  sunDeg: 45,
  showWind: false,
  windDeg: 135,
};

export type MarkerType = 'UNIT' | 'POI' | 'ROUTE' | 'ZONE' | 'ARROW' | 'TEXT';

export interface LayoutOverride {
  auto: boolean;
  cardAnchor: NormPoint | null;
  arrowCtrl: NormPoint | null;
  cardScale?: number;          // 0.5–1.8; default 1.0
}

export interface MarkerBase {
  id: string;
  type: MarkerType;
  order: number;
  layout: LayoutOverride;
}

export interface UnitMarker extends MarkerBase {
  type: 'UNIT';
  point: NormPoint;
  radius: number;           // normalised to short edge, 0.02–0.25
  status: UnitStatus;
  data: {
    code: string;           // REQUIRED, ≤40 chars
    area?: string;
    rooms?: string;
    orient?: string;
    view?: string;
    price?: string;
    loan?: string;      // Giá vay (bank loan valuation), e.g. "65 tr/m2"
    capital?: string;   // Vốn (upfront capital needed), e.g. "900 triệu"
    hook?: string;
  };
}

export type PoiIcon =
  | 'metro' | 'bus' | 'airport' | 'beach' | 'lake' | 'park' | 'school'
  | 'university' | 'hospital' | 'mall' | 'market' | 'bridge' | 'highway'
  | 'ferry' | 'golf' | 'admin';

export interface PoiMarker extends MarkerBase {
  type: 'POI';
  point: NormPoint;
  data: { icon: PoiIcon; name: string; dist?: string };
}

export interface RouteMarker extends MarkerBase {
  type: 'ROUTE';
  path: NormPoint[];        // >= 2 points
  data: { name: string; style: 'solid' | 'dashed'; color?: string };
}

export interface ZoneMarker extends MarkerBase {
  type: 'ZONE';
  path: NormPoint[];        // >= 3 points, closed polygon
  data: { name: string; fill?: string; opacity?: number };
}

export interface ArrowMarker extends MarkerBase {
  type: 'ARROW';
  from: NormPoint;
  to: NormPoint;
  data: { label?: string; color?: string };
}

export interface TextMarker extends MarkerBase {
  type: 'TEXT';
  point: NormPoint;
  data: { text: string };
}

export type Marker = UnitMarker | PoiMarker | RouteMarker | ZoneMarker | ArrowMarker | TextMarker;

export interface SceneImage {
  id: string;
  kind: ImageKind;
  w: number;
  h: number;
  displaySrc: string;       // object URL, ≤2560px, for interaction
  originalSrc: string;      // object URL of original, for export
}

export interface Scene {
  image: SceneImage;
  ratio: Ratio;
  preset: PresetId;
  displayMode: DisplayMode;
  compass: { show: boolean; deg: number };
  scaleBar: { show: boolean; metersPerPx: number };
  markers: Marker[];
}

export interface BrandKit {
  logo?: string;            // dataURL PNG transparent
  logoCorner: 'tl' | 'tr' | 'bl' | 'br';
  hotline: string;          // REQUIRED for export
  agentName?: string;
  accent?: string;          // overrides preset accent colour
  watermark: { enabled: boolean; opacity: number }; // 0.08–0.15
}

export interface Project {
  version: 1;
  id: string;
  name: string;
  updatedAt: number;
  scene: Scene;
  brandKit: BrandKit;
  disclaimer: string;       // never empty; falls back to DEFAULT_DISCLAIMER
}

export interface RenderOpts {
  target: 'preview' | 'export';
  pixelRatio: number;       // preview: 1 · export: 2
  container?: HTMLDivElement;
  focusMarkerId?: string;   // batch: only this unit is lit, others dimmed
  showSafeArea?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const RATIO_SIZE: Record<Ratio, { w: number; h: number }> = {
  '4:5':  { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1280, h: 720  },
  '1:1':  { w: 1080, h: 1080 },
};

/** Safe area in px at 1080-wide — leave space for Story/Reels UI chrome. */
export const SAFE_AREA: Record<Ratio, { top: number; bottom: number; side: number }> = {
  '4:5':  { top: 40,  bottom: 40,  side: 40 },
  '9:16': { top: 250, bottom: 320, side: 48 },
  '16:9': { top: 40,  bottom: 40,  side: 48 },
  '1:1':  { top: 40,  bottom: 40,  side: 40 },
};

export const LEGEND_THRESHOLD = { maxUnitCallout: 3, maxTotalCallout: 5 };
export const MAX_FIELD_LEN = 40;
export const MAX_CARD_LINES = 5;
export const MIN_CONTRAST_RATIO = 4.5;

export const DEFAULT_DISCLAIMER =
  'Hình ảnh mang tính minh họa. Thông tin có thể thay đổi, vui lòng liên hệ để xác nhận.';

/** Truncation priority: drop from the END first when card exceeds MAX_CARD_LINES. */
export const FIELD_PRIORITY = ['code', 'price', 'rooms', 'area', 'view', 'orient', 'loan', 'capital', 'hook'] as const;
