// Design tokens — all sizes in px at 1080-wide coordinate space; scale by width/1080 at render time.

export const SPACE = { xs: 8, sm: 12, md: 20, lg: 32, xl: 48 } as const;
export const RADIUS = { sm: 8, md: 16, lg: 24 } as const;

export const TYPO = {
  code:       { size: 46, weight: 700, lineHeight: 1.15 }, // T1 — unit code
  body:       { size: 26, weight: 400, lineHeight: 1.5  }, // T2 — specs
  highlight:  { size: 28, weight: 700, lineHeight: 1.25 }, // T3 — price / hook
  pill:       { size: 24, weight: 600, lineHeight: 1.3  }, // POI pill
  legend:     { size: 24, weight: 500, lineHeight: 1.45 },
  badge:      { size: 32, weight: 800, lineHeight: 1    },
  disclaimer: { size: 18, weight: 400, lineHeight: 1.3  },
  routeLabel: { size: 22, weight: 600, lineHeight: 1.2  },
} as const;

export const FONT_STACK = "'Be Vietnam Pro', 'Inter', system-ui, sans-serif";

// UNIT card dimensions in the 1080-wide coordinate space. Width is a range, not a fixed value —
// unitCard.ts grows it (up to the max) to fit content on one line before ever wrapping/shrinking.
export const CARD_W_1080     = 320;
export const CARD_W_1080_MAX = 460;
export const CARD_H_1080     = 268;

export const ELEVATION = {
  card:  { shadowColor: 'rgba(0,0,0,0.5)',  shadowBlur: 30, shadowOffsetY: 8 },
  arrow: { shadowColor: 'rgba(0,0,0,0.55)', shadowBlur: 14, shadowOffsetY: 4 },
  glow:  (c: string) => ({ shadowColor: c, shadowBlur: 35, shadowOpacity: 1 }),
} as const;

/** R1 — arrow outline is mandatory, no prop disables it. */
export const ARROW_OUTLINE = { stroke: '#FFFFFF', strokeWidth: 4 } as const;

export const MIN_CONTRAST_RATIO = 4.5;
