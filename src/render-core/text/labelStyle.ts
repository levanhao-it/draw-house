import { FONT_STACK } from '../../design/tokens';
import { labelDx, type LabelStyle } from '../../types/index';
import type { RunStyle } from './run';

// Times New Roman first: Georgia lacks stacked-diacritic Vietnamese glyphs (ồ, ầ, ể … draw as a base letter + a detached accent).
const SERIF_STACK = "'Times New Roman', Times, serif";

/** CSS font for a label: bold unless switched off, italic on request (synthesised — no italic face is bundled). */
export function labelFont(style: LabelStyle, px: number, boldWeight = 700): string {
  const face = style.labelSerif ? SERIF_STACK : FONT_STACK;
  return `${style.labelItalic ? 'italic ' : ''}${style.labelBold === false ? 400 : boldWeight} ${px}px ${face}`;
}

/** The text as it should be drawn: CAPITALS or Each Word Capitalised when asked for (NFC so letters stay whole). */
export function labelText(text: string, style: LabelStyle): string {
  const t = text.normalize('NFC');
  if (style.labelUpper) return t.toUpperCase();
  if (style.labelTitle) return t.toLowerCase().replace(/(^|\s)(\S)/gu, (_m, gap: string, ch: string) => gap + ch.toUpperCase());
  return t;
}

/** Letter spacing and underline / strike-through of a label at `fontSize`, ready for measureRun / fillRun. */
export function labelRun(style: LabelStyle, fontSize: number): RunStyle {
  return {
    spacing: fontSize * (style.labelSpacing ?? 0),
    underline: !!style.labelUnderline,
    strike: !!style.labelStrike,
  };
}

/** Extrusion of 3D lettering in px: down by `depth`, sideways by `dx` (negative = left). */
export function labelExtrusion(style: LabelStyle, fontSize: number): { depth: number; dx: number } {
  const base = fontSize * 0.4;
  return { depth: base * (style.label3dDepth ?? 1), dx: base * labelDx(style) };
}
