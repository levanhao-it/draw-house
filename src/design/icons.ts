import type { PoiIcon } from '../types/index';

export type FieldIconKey = 'area' | 'rooms' | 'orient' | 'view' | 'price' | 'hook' | 'loan' | 'capital';

export interface FieldIconDef {
  stroke?: string;
  fill?: string;
}

/**
 * Unit-card spec-field icons (viewBox 24×24, currentColor). Each combines a
 * stroked outline with a small solid accent so they stay readable at ~16px.
 */
export const FIELD_ICONS: Record<FieldIconKey, FieldIconDef> = {
  area: {
    stroke: 'M8 3H4v4M16 3h4v4M8 21H4v-4M16 21h4v-4',
  },
  rooms: {
    stroke:
      'M3 19v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 19h18M3 19v2M21 19v2M6 11V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3',
  },
  orient: {
    stroke: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    fill:   'M12 5L15.6 13.2L12 11L8.4 13.2Z',
  },
  view: {
    stroke: 'M2 19L7 10L10 13L16 6L22 19Z',
    fill:   'M18 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  },
  price: {
    stroke: 'M3 7h18v10H3z',
    fill:   'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
  hook: {
    fill: 'M12 3L14.1 9.1L20.6 9.2L15.4 13.1L17.3 19.3L12 15.6L6.7 19.3L8.6 13.1L3.4 9.2L9.9 9.1Z',
  },
  loan: {
    // Bank/institution silhouette (roof + columns + base) for "Giá vay" (loan valuation).
    stroke: 'M3 10L12 4L21 10M6.5 10V18M12 10V18M17.5 10V18M2 20H22',
  },
  capital: {
    // Wallet silhouette for "Vốn" (upfront cash on hand).
    stroke: 'M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM3 7V5a2 2 0 0 1 2-2h11',
    fill:   'M16.25 11.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  },
};

/** SVG path `d` strings for 16 POI icons (viewBox 24×24, stroke-based, currentColor). */
export const POI_ICONS: Record<PoiIcon, string> = {
  metro:
    'M4 8h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM1 17h22M8 16v3M16 16v3M4 12h16',
  bus:
    'M3 6h18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM1 10h22M7 17v3M17 17v3M8 10h8',
  airport:
    'M21 12l-7-4V5a2 2 0 0 0-4 0v3L3 12v2l7-1.5V17l-2 1.5V21l4-1 4 1v-2.5L14 17v-4.5z',
  beach:
    'M12 2a4 4 0 0 1 4 4c0 3-4 7-4 7S8 9 8 6a4 4 0 0 1 4-4zM12 6h.01M3 18c2-2 4-2 5.5 0 1.5 2 3 2 5 0 2-2 4-2 5 0',
  lake:
    'M2 12c2-4 5-4 7 0s5 4 7 0 5-4 7 0M2 17c2-4 5-4 7 0s5 4 7 0 5-4 7 0M9 5a3 3 0 1 1 6 0',
  park:
    'M12 2l-5 9h3v9h4v-9h3zM5 20h14',
  school:
    'M2 11l10-7 10 7v9H2v-9zM9 20v-5h6v5M15 8.5l3-2.5',
  university:
    'M2 10l10-7 10 7M4 10v9M8 10v9M16 10v9M20 10v9M2 19h20M2 10h20',
  hospital:
    'M3 5h18v14H3zM3 9h18M3 15h18M12 5v14M8 12h8',
  mall:
    'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M9 11a3 3 0 0 0 6 0',
  market:
    'M3 7h18l-2 12H5zM3 7l2-4h14l2 4M10 7v5M14 7v5',
  bridge:
    'M2 14q5-8 10-8t10 8M2 14v3h20v-3M6 17v-2M18 17v-2M12 6v2',
  highway:
    'M7 2v20M17 2v20M7 12h10M10 6h4M10 18h4',
  ferry:
    'M3 18h18M6 14l6-4 6 4v4H6v-4zM12 10V7M4 22h16',
  golf:
    'M6 21V5l12 5-12 5M6 21h13',
  admin:
    'M3 22V9l9-7 9 7v13H3zM8 22v-8h8v8M12 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
};

/** Display labels in Vietnamese for POI icon picker. */
export const POI_ICON_LABELS: Record<PoiIcon, string> = {
  metro:      'Metro/Tàu điện',
  bus:        'Xe buýt',
  airport:    'Sân bay',
  beach:      'Bãi biển',
  lake:       'Hồ/Sông',
  park:       'Công viên',
  school:     'Trường học',
  university: 'Đại học',
  hospital:   'Bệnh viện',
  mall:       'Trung tâm TM',
  market:     'Chợ',
  bridge:     'Cầu',
  highway:    'Cao tốc',
  ferry:      'Bến phà',
  golf:       'Sân golf',
  admin:      'Hành chính',
};
