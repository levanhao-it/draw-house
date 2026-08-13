import { MIN_CONTRAST_RATIO } from './tokens';

export type RGB = [number, number, number]; // 0–255 each channel

function toLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: RGB): number {
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker  = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

type ParsedColor = { rgb: RGB; alpha: number };

function parseColor(color: string): ParsedColor {
  const s = color.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt((hex[0] ?? '0').repeat(2), 16);
      const g = parseInt((hex[1] ?? '0').repeat(2), 16);
      const b = parseInt((hex[2] ?? '0').repeat(2), 16);
      return { rgb: [r, g, b], alpha: 1 };
    }
    return {
      rgb: [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)],
      alpha: 1,
    };
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (m) {
    return {
      rgb: [parseInt(m[1] ?? '0'), parseInt(m[2] ?? '0'), parseInt(m[3] ?? '0')],
      alpha: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  }
  return { rgb: [0, 0, 0], alpha: 1 };
}

/** Alpha-composite `color` over white to get an opaque effective colour. */
function blendOverWhite(rgb: RGB, alpha: number): RGB {
  return [
    Math.round(rgb[0] * alpha + 255 * (1 - alpha)),
    Math.round(rgb[1] * alpha + 255 * (1 - alpha)),
    Math.round(rgb[2] * alpha + 255 * (1 - alpha)),
  ];
}

function toColorString(rgb: RGB, alpha: number): string {
  if (alpha >= 1) {
    return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
  }
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.round(alpha * 100) / 100})`;
}

/**
 * Ensure fg text is readable over bg card colour.
 * Increases bg alpha in 0.06 steps, then flips fg if still insufficient.
 */
export function ensureContrast(
  bg: string,
  fg: string,
): { bg: string; fg: string; ok: boolean } {
  const { rgb: bgRgb, alpha: bgAlpha } = parseColor(bg);
  const { rgb: fgRgb } = parseColor(fg);

  let alpha = bgAlpha;
  let effective = blendOverWhite(bgRgb, alpha);
  let cr = contrastRatio(effective, fgRgb);

  if (cr >= MIN_CONTRAST_RATIO) return { bg, fg, ok: true };

  while (alpha < 0.96 && cr < MIN_CONTRAST_RATIO) {
    alpha = Math.min(0.96, alpha + 0.06);
    effective = blendOverWhite(bgRgb, alpha);
    cr = contrastRatio(effective, fgRgb);
  }

  if (cr >= MIN_CONTRAST_RATIO) {
    return { bg: toColorString(bgRgb, alpha), fg, ok: true };
  }

  // Last resort: flip fg to black or white, whichever is better
  const crBlack = contrastRatio(effective, [0, 0, 0]);
  const crWhite = contrastRatio(effective, [255, 255, 255]);
  const newFg = crBlack >= crWhite ? '#000000' : '#ffffff';
  const finalOk = Math.max(crBlack, crWhite) >= MIN_CONTRAST_RATIO;

  return { bg: toColorString(bgRgb, alpha), fg: newFg, ok: finalOk };
}
