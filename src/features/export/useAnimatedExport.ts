import { useCallback, useState } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import qrcode from 'qrcode-generator';
import type { AppState } from '../../hooks/useScene';
import type { Marker, NormPoint, UnitMarker } from '../../types/index';
import { getMarkerPoints } from '../../types/markerPoints';
import { getPreset } from '../../design/presets';
import { renderScene } from '../../render-core/index';
import {
  markerReveal, easeOutCubic, kenBurnsRect, kenBurnsPath, FULL_REVEAL,
  type MarkerTiming, type CameraKeyframe,
} from '../../render-core/animation';
import { FONT_STACK } from '../../design/tokens';
import { waitForFonts } from '../../lib/fonts';
import { downloadBlob } from '../../lib/download';
import { planClip, ENDING_IN_SEC } from './clipPlan';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const VIDEO_MAX_LONG_EDGE = 1280; // capped res for the WebM export — size & encode time, not print quality
const VIDEO_FPS           = 20;
// GIF has no inter-frame compression (every frame is compressed independently), so the
// same settings as video would produce a huge file (~56MB observed at 1280/20fps/8s) —
// needs a much smaller res+fps to stay a reasonably shareable size.
const GIF_MAX_LONG_EDGE   = 640;
const GIF_FPS             = 10;
const ZOOM          = 1.06; // "zoom nhẹ Ken Burns 1.0→1.06" — slight, not dramatic

// "Story" camera mode (alternative to the single continuous zoom above): tours markers in
// reveal order instead of zooming toward just one. Its own, stronger max zoom is fine since
// the camera is already moving between stops, unlike the single-point mode's held-still zoom.
export type CameraMode = 'single' | 'story';
const STORY_MAX_STOPS = 5;
const STORY_ZOOM_MAX  = 1.25;

function getSupportedVideoFormat(): { mimeType: string; extension: 'mp4' | 'webm' } | null {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') return null;

  // MP4/H.264 is the most widely supported format on phones. Chrome/Firefox usually
  // do not expose it through MediaRecorder, so keep VP8 WebM as the browser fallback.
  const formats = [
    { mimeType: 'video/mp4;codecs="avc1.42E01E"', extension: 'mp4' as const },
    { mimeType: 'video/mp4', extension: 'mp4' as const },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' as const },
    { mimeType: 'video/webm', extension: 'webm' as const },
  ];
  return formats.find(format => MediaRecorder.isTypeSupported(format.mimeType)) ?? null;
}

function outputSize(w: number, h: number, maxLongEdge: number): { w: number; h: number } {
  const aspect = w / h;
  if (aspect >= 1) {
    const outW = Math.min(maxLongEdge, w);
    return { w: outW, h: Math.round(outW / aspect) };
  }
  const outH = Math.min(maxLongEdge, h);
  return { w: Math.round(outH * aspect), h: outH };
}

/** Black-on-white QR (never tinted — keeps it reliably scannable) encoding a tel: link. */
function buildQrCanvas(hotline: string): HTMLCanvasElement {
  const qr = qrcode(0, 'M');
  qr.addData(`tel:${hotline.replace(/[^0-9+]/g, '')}`);
  qr.make();
  const count  = qr.getModuleCount();
  const cellPx = 8;
  const size   = count * cellPx;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const cctx = c.getContext('2d')!;
  cctx.fillStyle = '#FFFFFF';
  cctx.fillRect(0, 0, size, size);
  cctx.fillStyle = '#000000';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) cctx.fillRect(col * cellPx, row * cellPx, cellPx, cellPx);
    }
  }
  return c;
}

/** Pre-renders the ending card's WHOLE static visual (white rounded-rect + drop shadow + QR
 *  + hotline text) once into a bitmap. `ctx.shadowBlur` on a large filled shape is one of the
 *  most expensive Canvas2D operations — redoing it from scratch on every single frame of the
 *  ending outro was the real cause of the visible stutter reported right at the end of
 *  exports. Rendered once here instead; per-frame
 *  cost drops to a single cheap `drawImage`. `margin` leaves room so the shadow isn't clipped
 *  at the bitmap's edge. */
function buildEndingCard(
  w: number, h: number,
  qrCanvas: HTMLCanvasElement | null,
  hotline: string,
  accent: string,
): HTMLCanvasElement | null {
  const hasHotline = hotline.trim().length > 0;
  if (!qrCanvas && !hasHotline) return null;

  const s        = w / 1080;
  const qrSize   = Math.min(w, h) * 0.28;
  const pad      = 24 * s;
  const fontSize = 30 * s;
  const cardW    = Math.max(qrSize, 260 * s) + pad * 2;
  const cardH    = (qrCanvas ? qrSize + pad * 0.6 : 0) + (hasHotline ? fontSize + pad * 0.6 : 0) + pad * 2;
  const margin   = 32 * s;

  const bitmap = document.createElement('canvas');
  bitmap.width  = Math.ceil(cardW + margin * 2);
  bitmap.height = Math.ceil(cardH + margin * 2);
  const ctx = bitmap.getContext('2d')!;

  ctx.translate(margin, margin);
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur  = 24 * s;
  ctx.fillStyle   = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(0, 0, cardW, cardH, 16 * s);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  let cy = pad;
  if (qrCanvas) {
    ctx.drawImage(qrCanvas, (cardW - qrSize) / 2, cy, qrSize, qrSize);
    cy += qrSize + pad * 0.6;
  }
  if (hasHotline) {
    ctx.font         = `700 ${fontSize}px ${FONT_STACK}`;
    ctx.fillStyle    = accent;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(hotline, cardW / 2, cy);
  }

  return bitmap;
}

/** Outro: pops the pre-rendered card bitmap (see `buildEndingCard`) in over ENDING_IN_SEC,
 *  on a subtly dimmed backdrop so it reads over any photo. `sinceStartSec` is negative until
 *  the outro begins. */
function drawEndingCard(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, sinceStartSec: number,
  card: HTMLCanvasElement | null,
): void {
  if (!card) return;
  const endP = Math.max(0, Math.min(1, sinceStartSec / ENDING_IN_SEC));
  if (endP <= 0) return;
  const ease = easeOutCubic(endP);

  ctx.save();
  ctx.globalAlpha = ease * 0.4;
  ctx.fillStyle   = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = ease;
  ctx.translate(w / 2, h / 2);
  ctx.scale(0.9 + 0.1 * ease, 0.9 + 0.1 * ease);
  ctx.translate(-card.width / 2, -card.height / 2);
  ctx.drawImage(card, 0, 0);
  ctx.restore();
}

/** A marker's single "look-at" point for the story camera — the centroid of all its
 *  editable points. Already correct for every type with no per-type branching: UNIT/POI/
 *  TEXT have exactly one point, ARROW's from+to average to its midpoint, ROUTE/ZONE average
 *  to roughly the middle of their path. */
function markerFocusPoint(marker: Marker): NormPoint {
  const points = getMarkerPoints(marker);
  const x = points.reduce((sum, p) => sum + p.pos.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.pos.y, 0) / points.length;
  return { x, y };
}

/** Builds the story camera's stops: an opening wide shot, then up to STORY_MAX_STOPS markers
 *  (evenly subsampled by index if there are more, which always keeps the last one — `sorted`'s
 *  own last element, the primary unit per the "UNIT always last" resort below), each arrived
 *  at right as it finishes revealing so the camera move and the reveal read as one motion.
 *  Zoom ramps from 1x (wide shot) to STORY_ZOOM_MAX at the final stop. */
function buildCameraKeyframes(sorted: Marker[], timings: MarkerTiming[]): CameraKeyframe[] {
  const n = sorted.length;
  if (n === 0) return [{ atSec: 0, target: null, zoom: 1 }];

  const stopCount = Math.min(n, STORY_MAX_STOPS);
  const keyframes: CameraKeyframe[] = [{ atSec: 0, target: null, zoom: 1 }];
  for (let stopI = 0; stopI < stopCount; stopI++) {
    const idx    = stopCount === 1 ? n - 1 : Math.round((stopI * (n - 1)) / (stopCount - 1));
    const timing = timings[idx]!;
    const zoomP  = stopCount === 1 ? 1 : stopI / (stopCount - 1);
    keyframes.push({
      atSec:  timing.startSec + timing.fadeInSec,
      target: markerFocusPoint(sorted[idx]!),
      zoom:   1 + (STORY_ZOOM_MAX - 1) * zoomP,
    });
  }
  return keyframes;
}

export function useAnimatedExport(state: AppState) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress]   = useState(0);

  const prepare = useCallback(async (holdSec: number, maxLongEdge: number, cameraMode: CameraMode = 'single') => {
    if (!state.image) return null;
    await waitForFonts();

    const img    = await loadImage(state.image.originalSrc);
    const preset = getPreset(state.preset);
    const { w, h } = outputSize(state.image.w, state.image.h, maxLongEdge);

    const src    = document.createElement('canvas');
    src.width = w; src.height = h;
    const srcCtx = src.getContext('2d');
    if (!srcCtx) return null;

    const hasHotline = state.brand.hotline.trim().length > 0;
    const { sorted, timings, endingStartSec, durationSec } = planClip(state.markers, holdSec, hasHotline);
    const firstUnit = sorted.find((m): m is UnitMarker => m.type === 'UNIT') ?? null;
    const target    = firstUnit?.point ?? null;
    const cameraKeyframes = cameraMode === 'story' ? buildCameraKeyframes(sorted, timings) : null;
    const qrCanvas   = hasHotline ? buildQrCanvas(state.brand.hotline) : null;
    const endingCard = buildEndingCard(w, h, qrCanvas, state.brand.hotline, preset.accent);

    function renderFrame(outCtx: CanvasRenderingContext2D, t: number) {
      const elapsedSec = t * durationSec;
      const revealOf = (id: string) => {
        const idx = sorted.findIndex(m => m.id === id);
        return idx === -1 ? FULL_REVEAL : markerReveal(timings[idx]!, elapsedSec);
      };
      renderScene(
        srcCtx!, img, sorted, { w, h }, preset,
        state.brand, state.disclaimer, state.displayMode, state.spotlightMode, state.spotlightSettings, state.compass, revealOf,
      );
      const { sx, sy, sw, sh } = cameraKeyframes
        ? kenBurnsPath(elapsedSec, w, h, cameraKeyframes)
        : kenBurnsRect(t, w, h, target, ZOOM);
      outCtx.clearRect(0, 0, w, h);
      outCtx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
      drawEndingCard(outCtx, w, h, elapsedSec - endingStartSec, endingCard);
    }

    return { w, h, durationSec, renderFrame };
  }, [state]);

  const exportGif = useCallback(async (holdSec: number, cameraMode: CameraMode = 'single') => {
    setExporting(true);
    setProgress(0);
    try {
      const ready = await prepare(holdSec, GIF_MAX_LONG_EDGE, cameraMode);
      if (!ready) return;
      const { w, h, durationSec, renderFrame } = ready;

      const out    = document.createElement('canvas');
      out.width = w; out.height = h;
      const outCtx = out.getContext('2d');
      if (!outCtx) return;

      const totalFrames = Math.max(1, Math.round(durationSec * GIF_FPS));
      const gif = GIFEncoder();
      for (let i = 0; i < totalFrames; i++) {
        const t = totalFrames <= 1 ? 0 : i / (totalFrames - 1);
        renderFrame(outCtx, t);
        const { data } = outCtx.getImageData(0, 0, w, h);
        const palette = quantize(data, 256);
        const index   = applyPalette(data, palette);
        gif.writeFrame(index, w, h, { palette, delay: 1000 / GIF_FPS });
        setProgress((i + 1) / totalFrames);
        // Yield periodically so the tab stays responsive during the encode burst
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));
      }
      gif.finish();
      downloadBlob(new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' }), 'vecan_export.gif');
    } finally {
      setExporting(false);
    }
  }, [prepare]);

  const exportVideo = useCallback(async (holdSec: number, cameraMode: CameraMode = 'single') => {
    setExporting(true);
    setProgress(0);
    try {
      const ready = await prepare(holdSec, VIDEO_MAX_LONG_EDGE, cameraMode);
      if (!ready) return;
      const { w, h, durationSec, renderFrame } = ready;

      const out    = document.createElement('canvas');
      out.width = w; out.height = h;
      const outCtx = out.getContext('2d');
      if (!outCtx) return;

      const videoFormat = getSupportedVideoFormat();
      if (!videoFormat) return;

      // Manual capture (frameRate 0 + track.requestFrame()) when supported (Chrome/Edge/Safari,
      // not Firefox) so every encoded frame is a deliberately-just-rendered one, instead of
      // captureStream's own timer sampling the canvas — which, if a frame render ever runs a
      // little long, can grab and duplicate a stale frame and make the result look choppier
      // the longer the recording runs. Falls back to automatic sampling if unsupported.
      const manualCapture = out.captureStream(0);
      const track = manualCapture.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
      const useManual = typeof track?.requestFrame === 'function';
      if (!useManual) {
        // Manual mode unsupported here — recreate the stream in automatic mode instead.
        manualCapture.getTracks().forEach(t => t.stop());
      }
      const liveStream = useManual ? manualCapture : out.captureStream(VIDEO_FPS);

      const recorder = new MediaRecorder(liveStream, { mimeType: videoFormat.mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });

      recorder.start();
      const startedAt = performance.now();
      const frameIntervalMs = 1000 / VIDEO_FPS;
      // setTimeout, not requestAnimationFrame — rAF fully STOPS firing once the tab loses
      // focus/visibility (a recording this long is enough for a user to easily alt-tab away
      // while waiting), which silently hung the whole export forever. setTimeout keeps
      // running (browsers only clamp its rate in background tabs, never fully suspend it),
      // so the export reliably finishes even if the page isn't in the foreground the whole
      // time — this is also the likely cause of the reported "longer duration = laggier"
      // (more wall-clock time = more chance of losing focus mid-export).
      await new Promise<void>(resolve => {
        function tick() {
          const elapsed = (performance.now() - startedAt) / 1000;
          const t = Math.min(1, elapsed / durationSec);
          const done = t >= 1;
          renderFrame(outCtx!, t);
          if (useManual) track!.requestFrame!();
          setProgress(t);
          if (done) { resolve(); return; }
          setTimeout(tick, frameIntervalMs);
        }
        tick();
      });
      recorder.stop();
      await stopped;

      downloadBlob(new Blob(chunks, { type: videoFormat.mimeType }), `vecan_export.${videoFormat.extension}`);
    } finally {
      setExporting(false);
    }
  }, [prepare]);

  return { exportGif, exportVideo, exporting, progress };
}