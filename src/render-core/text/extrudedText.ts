import { measureRun, fillRun, strokeRun, type RunStyle } from './run';

export interface ExtrudedTextOpts {
  /** Colour of the extruded sides (the face itself is white). */
  color: string;
  fontSize: number;
  /** CSS font for a given pixel size. */
  font: (px: number) => string;
  /** Letter spacing and underline / strike-through. */
  run: RunStyle;
  /** Extrusion in px: down by `depth`, and sideways by `dx` (negative = to the left). */
  depth: number;
  dx: number;
}

const SPRITE_SCALE = 2; // sides are rasterised at 2x so they stay crisp once resampled
const EDGE_BAND_PX = 2; // thickness of the glyph-edge band each side face is swept from
const CACHE_MAX    = 24;

interface SideSprite { canvas: OffscreenCanvas; padLeft: number; padTop: number }
const sprites = new Map<string, SideSprite>();

/** Chunky 3D block lettering centred on (x, y): white face with a dark edge, extruded sides shaded by the
 *  direction they face (sideways lighter, bottom darker) and a soft ground shadow. Sets no globalAlpha, so a
 *  caller's fade-in multiplies straight through. */
export function drawExtrudedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  { color, fontSize, font, run, depth, dx }: ExtrudedTextOpts,
): void {
  // Light comes from the upper left: a left-facing side catches it, a right-facing one doesn't.
  const toneSide   = dx < 0 ? mixHex(color, '#FFFFFF', 0.1) : mixHex(color, '#000000', 0.1);
  const toneBottom = mixHex(color, '#000000', 0.4);

  ctx.save();
  ctx.font         = font(fontSize);
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin     = 'round';
  const width = measureRun(ctx, text, run);
  const left  = x - width / 2;

  // Deepest layer first: it casts the soft ground shadow.
  ctx.fillStyle     = toneBottom;
  ctx.shadowColor   = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur    = fontSize * 0.3;
  ctx.shadowOffsetY = fontSize * 0.1;
  fillRun(ctx, text, left + dx, y + depth, fontSize, run);
  ctx.shadowColor = 'transparent';

  if (Math.abs(dx) >= 0.5 || depth >= 0.5) {
    const sides = sideSprite(text, font, fontSize, run, dx, depth, width, toneSide, toneBottom);
    if (sides) {
      const s = SPRITE_SCALE;
      ctx.drawImage(
        sides.canvas,
        left - sides.padLeft / s, y - sides.padTop / s,
        sides.canvas.width / s, sides.canvas.height / s,
      );
    } else {
      // No OffscreenCanvas: stack plain offset copies, darker the deeper.
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), depth)));
      for (let i = steps - 1; i >= 1; i--) {
        const t = i / steps;
        ctx.fillStyle = mixHex(color, '#000000', 0.1 + 0.3 * t);
        fillRun(ctx, text, left + dx * t, y + depth * t, fontSize, run);
      }
    }
  }

  // Dark edge keeps the white face crisp on any photo, then the lit face on top.
  ctx.strokeStyle = mixHex(color, '#000000', 0.6);
  ctx.lineWidth   = fontSize * 0.07;
  strokeRun(ctx, text, left, y, fontSize, run);

  const face = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
  face.addColorStop(0, '#FFFFFF');
  face.addColorStop(1, mixHex(color, '#FFFFFF', 0.85));
  ctx.fillStyle = face;
  fillRun(ctx, text, left, y, fontSize, run);

  ctx.restore();
}

/**
 * The extruded sides as a cached bitmap. Each glyph edge facing the extrusion's sideways (resp. downward)
 * direction is isolated as a thin band by subtracting the glyph shifted against it, tinted, then swept along
 * the extrusion vector — so sideways and bottom faces get different tones, which is what makes the lettering
 * read as solid blocks. Null without OffscreenCanvas (the caller then stacks plain layers instead).
 */
function sideSprite(
  text: string, font: (px: number) => string, fontSize: number, run: RunStyle, dx: number, depth: number,
  textWidth: number, toneSide: string, toneBottom: string,
): SideSprite | null {
  if (typeof OffscreenCanvas === 'undefined') return null;
  // `textWidth` is measured with the font actually in effect, so a web font finishing its load rebuilds the sprite.
  const key = [
    text, font(1), fontSize.toFixed(2), run.spacing.toFixed(2), run.underline, run.strike,
    dx.toFixed(2), depth.toFixed(2), textWidth.toFixed(1), toneSide, toneBottom,
  ].join('|');
  const hit = sprites.get(key);
  if (hit) return hit;

  const S  = SPRITE_SCALE;
  const fs = fontSize * S;
  const vx = dx * S;
  const vy = depth * S;
  const needSide   = Math.abs(vx) >= 1;
  const needBottom = vy >= 1;
  const make = (w: number, h: number) => { const c = new OffscreenCanvas(w, h); return [c, c.getContext('2d')] as const; };

  const scaledRun: RunStyle = { ...run, spacing: run.spacing * S };
  const fontCss = font(fs);
  const meter = make(1, 1)[1];
  if (!meter) return null;
  meter.font = fontCss;
  const tw      = Math.ceil(measureRun(meter, text, scaledRun));
  const padX    = Math.ceil(fs * 0.25);
  const padLeft = padX + Math.ceil(Math.max(0, -vx));
  const padTop  = Math.ceil(fs * 0.8); // room for stacked Vietnamese diacritics
  const w = tw + padLeft + padX + Math.ceil(Math.max(0, vx)) + 2;
  const h = padTop + Math.ceil(fs * 0.7) + Math.ceil(vy) + 2;

  const [mask, maskCtx] = make(w, h);
  if (!maskCtx) return null;
  maskCtx.font = fontCss;
  maskCtx.textAlign = 'left';
  maskCtx.textBaseline = 'middle';
  maskCtx.fillStyle = '#FFFFFF';
  fillRun(maskCtx, text, padLeft, padTop, fs, scaledRun);

  const edgeBand = (shiftX: number, shiftY: number, tone: string) => {
    const [band, g] = make(w, h);
    if (!g) return null;
    g.drawImage(mask, 0, 0);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(mask, -shiftX, -shiftY); // leaves only the pixels whose neighbour in that direction is empty
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = tone;
    g.fillRect(0, 0, w, h);
    return band;
  };
  const side   = needSide ? edgeBand(Math.sign(vx) * EDGE_BAND_PX, 0, toneSide) : null;
  const bottom = needBottom ? edgeBand(0, EDGE_BAND_PX, toneBottom) : null;
  const [first, firstCtx]   = make(w, h);
  const [second, secondCtx] = make(w, h);
  if ((needSide && !side) || (needBottom && !bottom) || !firstCtx || !secondCtx) return null;

  // Sweep the bands along the extrusion vector by doubling: each pass copies everything built so far one
  // block deeper, underneath itself, so n slices cost log2(n) draws instead of n. Slices stay ≤1px apart,
  // which keeps slanted faces gap-free.
  const slices = 1 << Math.ceil(Math.log2(Math.max(Math.abs(vx), vy, 1) + 1));
  let cur   = { canvas: first, g: firstCtx };
  let spare = { canvas: second, g: secondCtx };
  if (bottom) cur.g.drawImage(bottom, 0, 0);
  if (side) cur.g.drawImage(side, 0, 0);
  for (let block = 1; block < slices; block *= 2) {
    spare.g.clearRect(0, 0, w, h);
    spare.g.drawImage(cur.canvas, (vx * block) / (slices - 1), (vy * block) / (slices - 1));
    spare.g.drawImage(cur.canvas, 0, 0);
    [cur, spare] = [spare, cur];
  }

  const sprite = { canvas: cur.canvas, padLeft, padTop };
  if (sprites.size >= CACHE_MAX) sprites.delete(sprites.keys().next().value!);
  sprites.set(key, sprite);
  return sprite;
}

/** Mixes `hex` (#RGB / #RRGGBB) toward black or white by `t`; returns the input untouched if it isn't hex. */
function mixHex(hex: string, toward: '#000000' | '#FFFFFF', t: number): string {
  if (!hex.startsWith('#')) return hex;
  const h    = hex.slice(1);
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const rgb  = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  if (full.length !== 6 || rgb.some(Number.isNaN)) return hex;
  const target = toward === '#FFFFFF' ? 255 : 0;
  const [r, g, b] = rgb.map(c => Math.round(c! + (target - c!) * t));
  return `rgb(${r}, ${g}, ${b})`;
}
