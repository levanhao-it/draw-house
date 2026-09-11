import { toPx, type Size } from '../geom';
import { FULL_REVEAL, landedPulse, type MarkerReveal } from '../animation';
import { DEFAULT_SPOTLIGHT_SETTINGS, type SpotlightSettings, type UnitMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

// Reused scratch canvas (perf: avoids allocating a full-resolution OffscreenCanvas every
// single frame — matters once this runs dozens of times/sec during animated video export).
// Same "impure module-level cache" exception as design/poiIconImages.ts.
let scratch: OffscreenCanvas | null = null;
function getScratchCanvas(w: number, h: number): OffscreenCanvas {
  if (!scratch || scratch.width !== w || scratch.height !== h) scratch = new OffscreenCanvas(w, h);
  return scratch;
}

/** Dim overlay with soft radial spotlight cutouts for each unit marker.
 *  `settings` (default: matches the classic look) controls how dark the surroundings get,
 *  how soft the edge feather is, and how fully lit the centre is — "sale muốn vùng sáng vào
 *  đúng căn, tối phần còn lại". `revealOf` (default: always fully revealed) fades each
 *  marker's own cutout+ring in, plus a brief bright ripple right as it lands ("loé sáng") —
 *  used by the animated (video/GIF) export for a one-by-one reveal. */
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  frame: Size,
  unitMarkers: UnitMarker[],
  preset: Preset,
  settings: SpotlightSettings = DEFAULT_SPOTLIGHT_SETTINGS,
  revealOf: (id: string) => MarkerReveal = () => FULL_REVEAL,
): void {
  if (unitMarkers.length === 0) return;

  const dimAlpha = settings.dimAlpha ?? preset.dimAlpha;
  const { accent } = preset;
  const shortEdge = Math.min(frame.w, frame.h);
  const outerMult = 1 + settings.softness; // softness=0.6 (default) reproduces the old fixed 1.6x feather
  const eraseAlpha = settings.intensity;   // intensity=1 (default) reproduces the old always-fully-opaque erase

  // Compose dim+cutout on an OffscreenCanvas to avoid layering artefacts
  if (typeof OffscreenCanvas !== 'undefined') {
    const oc = getScratchCanvas(frame.w, frame.h);
    // Non-null assertion safe: OffscreenCanvas always supports '2d'
    const oc2d = oc.getContext('2d')!;
    // Reset state left over from the last reuse of this scratch canvas.
    oc2d.globalCompositeOperation = 'source-over';
    oc2d.globalAlpha = 1;
    oc2d.clearRect(0, 0, frame.w, frame.h);
    oc2d.fillStyle = `rgba(0,0,0,${dimAlpha})`;
    oc2d.fillRect(0, 0, frame.w, frame.h);

    oc2d.globalCompositeOperation = 'destination-out';
    for (const m of unitMarkers) {
      const { x, y } = toPx(m.point, frame);
      const r = m.radius * shortEdge;
      const grad = oc2d.createRadialGradient(x, y, 0, x, y, r * outerMult);
      // Erases up to `eraseAlpha` from centre to 1.0r, then fades to no erase at outerMult·r
      grad.addColorStop(0, `rgba(0,0,0,${eraseAlpha})`);
      grad.addColorStop(1 / outerMult, `rgba(0,0,0,${eraseAlpha})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      oc2d.fillStyle = grad;
      oc2d.globalAlpha = revealOf(m.id).p;
      oc2d.beginPath();
      oc2d.arc(x, y, r * outerMult, 0, Math.PI * 2);
      oc2d.fill();
    }
    ctx.drawImage(oc, 0, 0);
  } else {
    // Fallback: sharp cutout with even-odd rule
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${dimAlpha})`;
    ctx.beginPath();
    ctx.rect(0, 0, frame.w, frame.h);
    for (const m of unitMarkers) {
      const { x, y } = toPx(m.point, frame);
      ctx.arc(x, y, m.radius * shortEdge, 0, Math.PI * 2);
    }
    ctx.fill('evenodd');
    ctx.restore();
  }

  // Accent glow ring around each spotlight
  const s = frame.w / 1080;
  for (const m of unitMarkers) {
    const { x, y } = toPx(m.point, frame);
    const r = m.radius * shortEdge;
    const { p: a, sinceLandedSec } = revealOf(m.id);
    ctx.save();
    // R1: white halo first so the ring stays legible on any photo background
    ctx.strokeStyle = '#FFFFFF';
    ctx.globalAlpha = 0.9 * a;
    ctx.lineWidth   = 5 * s;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = a;

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3 * s;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20 * s;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // "Spotlight loé sáng": a bright ring ripples outward and fades right as it lands
    const flash = landedPulse(sinceLandedSec, 0, 0.3);
    if (flash > 0) {
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha  = flash * 0.85;
      ctx.lineWidth    = 4 * s * flash;
      ctx.beginPath();
      ctx.arc(x, y, r * (1 + 0.4 * (1 - flash)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
