/** One line of text drawn with extra letter spacing and optional underline / strike-through bars. */
export interface RunStyle { spacing: number; underline: boolean; strike: boolean }

const BAR_THICKNESS = 0.075; // of the font size
const UNDERLINE_Y   = 0.385; // bar centre below the em-box middle (textBaseline 'middle'), of the font size
const STRIKE_Y      = 0.03;

/** Width of `text` with `style.spacing` px between letters; the font must already be set on `ctx`. */
export function measureRun(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, style: RunStyle): number {
  const base = ctx.measureText(text).width;
  return style.spacing === 0 ? base : base + style.spacing * (Array.from(text).length - 1);
}

// Expects textAlign 'left' and textBaseline 'middle'. Spacing is applied by placing letters one by one, since
// ctx.letterSpacing isn't available everywhere (older iPadOS Safari).
function paintRun(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  paint: 'fill' | 'stroke',
  text: string, x: number, y: number, size: number, style: RunStyle,
): void {
  const draw = (s: string, px: number) => (paint === 'fill' ? ctx.fillText(s, px, y) : ctx.strokeText(s, px, y));
  if (style.spacing === 0) {
    draw(text, x);
  } else {
    const chars = Array.from(text);
    chars.forEach((ch, i) => {
      // Start of letter i including its kerning with the previous one
      const start = ctx.measureText(chars.slice(0, i + 1).join('')).width - ctx.measureText(ch).width;
      draw(ch, x + start + i * style.spacing);
    });
  }

  const bars = [style.underline ? UNDERLINE_Y : null, style.strike ? STRIKE_Y : null];
  if (bars.every(b => b === null)) return;
  const w = measureRun(ctx, text, style);
  const h = Math.max(1, size * BAR_THICKNESS);
  for (const centre of bars) {
    if (centre === null) continue;
    const top = y + size * centre - h / 2;
    if (paint === 'fill') ctx.fillRect(x, top, w, h);
    else ctx.strokeRect(x, top, w, h);
  }
}

export const fillRun = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, size: number, style: RunStyle,
): void => paintRun(ctx, 'fill', text, x, y, size, style);

export const strokeRun = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, size: number, style: RunStyle,
): void => paintRun(ctx, 'stroke', text, x, y, size, style);
