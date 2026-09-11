import { toPx, type Size } from '../geom';
import type { UnitMarker } from '../../types/index';
import type { Preset } from '../../design/presets';

/** Dim overlay with soft radial spotlight cutouts for each unit marker. */
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  frame: Size,
  unitMarkers: UnitMarker[],
  preset: Preset,
): void {
  if (unitMarkers.length === 0) return;

  const { dimAlpha, accent } = preset;
  const shortEdge = Math.min(frame.w, frame.h);

  // Compose dim+cutout on an OffscreenCanvas to avoid layering artefacts
  if (typeof OffscreenCanvas !== 'undefined') {
    const oc = new OffscreenCanvas(frame.w, frame.h);
    // Non-null assertion safe: OffscreenCanvas always supports '2d'
    const oc2d = oc.getContext('2d')!;
    oc2d.fillStyle = `rgba(0,0,0,${dimAlpha})`;
    oc2d.fillRect(0, 0, frame.w, frame.h);

    oc2d.globalCompositeOperation = 'destination-out';
    for (const m of unitMarkers) {
      const { x, y } = toPx(m.point, frame);
      const r = m.radius * shortEdge;
      const grad = oc2d.createRadialGradient(x, y, 0, x, y, r * 1.6);
      // Fully opaque (erases dim) from centre to 1.0r, then fades to transparent at 1.6r
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1 / 1.6, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      oc2d.fillStyle = grad;
      oc2d.beginPath();
      oc2d.arc(x, y, r * 1.6, 0, Math.PI * 2);
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
    ctx.save();
    // R1: white halo first so the ring stays legible on any photo background
    ctx.strokeStyle = '#FFFFFF';
    ctx.globalAlpha = 0.9;
    ctx.lineWidth   = 5 * s;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3 * s;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20 * s;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
