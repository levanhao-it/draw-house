import { useEffect, useRef, useCallback, useState } from 'react';
import type { AppState, SceneAction } from '../../hooks/useScene';
import type { UnitMarker, PoiMarker, RouteMarker, ZoneMarker, ArrowMarker, TextMarker, NormPoint } from '../../types/index';
import { getPreset } from '../../design/presets';
import { renderScene } from '../../render-core/index';
import { getCardPlacements } from '../../render-core/place';
import { resolveDisplayMode } from '../../render-core/layers/legendLayer';
import { toPx, type Rect } from '../../render-core/geom';
import { getMarkerPoints, withMarkerPoint, type PointRef } from '../../types/markerPoints';
import { markerId } from '../../lib/id';
import { vi } from '../../i18n/vi';
import QuickInputPopover from './QuickInputPopover';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<SceneAction>;
}

interface Popover { markerId: string; kind: 'UNIT' | 'TEXT'; screenX: number; screenY: number }

/** Pixels-threshold below which two consecutive clicks are merged (double-click dedup). */
const DBLCLICK_MS = 320;

export default function StageCanvas({ state, dispatch }: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const imgRef         = useRef<HTMLImageElement | null>(null);
  const loadedSrc      = useRef<string | null>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [popover, setPopover]         = useState<Popover | null>(null);

  // Drag-card state (T-401 lite)
  const cardPlacements  = useRef<Map<string, Rect>>(new Map());
  const dragRef         = useRef<{
    markerId: string;
    mode: 'move' | 'resize';
    offsetX: number; offsetY: number;
    startX: number; startY: number;
    active: boolean;
    initialCardScale: number;
    initialCardW: number;
    initialCardH: number;
    frameW: number;
  } | null>(null);
  const dragPositionRef = useRef<{ id: string; pos: NormPoint } | null>(null);
  const dragScaleRef    = useRef<{ id: string; scale: number } | null>(null);

  // Drag state for any single point on the selected marker (POI/TEXT/UNIT point,
  // ARROW from/to, or a ROUTE/ZONE path vertex) — one mechanism for every type.
  const pointDragRef = useRef<{
    markerId: string; ref: PointRef;
    active: boolean; startX: number; startY: number;
  } | null>(null);
  const dragPointRef = useRef<{ id: string; ref: PointRef; pos: NormPoint } | null>(null);

  const [dragTick, setDragTick]     = useState(0);
  const suppressNextClick           = useRef(false);
  const [dragCursor, setDragCursor] = useState('cursor-crosshair');

  // Pending path for ROUTE / ZONE / ARROW tools (local UI state — not committed yet)
  const [pendingPath, setPendingPath]   = useState<NormPoint[]>([]);
  const pendingPathRef                  = useRef<NormPoint[]>([]);
  const clickTimerRef                   = useRef<number | null>(null);

  const isPathTool = state.activeTool === 'ROUTE' || state.activeTool === 'ZONE' || state.activeTool === 'ARROW';

  // Cancel pending path when tool changes
  useEffect(() => {
    setPendingPath([]);
    pendingPathRef.current = [];
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
  }, [state.activeTool]);

  // Keyboard: ESC = cancel, Enter = commit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingPath([]);
        pendingPathRef.current = [];
        if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
      } else if (e.key === 'Enter' && isPathTool) {
        commitPath();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // commitPath is stable via useCallback below; add isPathTool
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPathTool]);

  // Use the actual image aspect so the canvas always matches the original
  const aspect = state.image ? state.image.w / state.image.h : 4 / 3;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const w = Math.floor(Math.min(width, height * aspect));
      setDisplaySize({ w, h: Math.floor(w / aspect) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [aspect]);

  // Main render + pending-path overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displaySize.w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const preset = getPreset(state.preset);

    if (!state.image) { ctx.clearRect(0, 0, displaySize.w, displaySize.h); return; }

    // Apply local drag preview without a store round-trip
    const renderMarkers = (() => {
      if (!dragPositionRef.current && !dragScaleRef.current && !dragPointRef.current) return state.markers;
      return state.markers.map(m => {
        if (dragPositionRef.current?.id === m.id)
          return { ...m, layout: { ...m.layout, auto: false, cardAnchor: dragPositionRef.current!.pos } };
        if (dragScaleRef.current?.id === m.id)
          return { ...m, layout: { ...m.layout, cardScale: dragScaleRef.current!.scale } };
        if (dragPointRef.current?.id === m.id)
          return withMarkerPoint(m, dragPointRef.current.ref, dragPointRef.current.pos);
        return m;
      });
    })();

    // Update card placement cache from committed state (not drag preview)
    const mode = state.displayMode === 'auto' ? resolveDisplayMode(state.markers) : state.displayMode;
    cardPlacements.current = mode === 'callout' ? getCardPlacements(state.markers, displaySize, ctx, preset) : new Map();

    const doRender = (img: HTMLImageElement) => {
      renderScene(ctx, img, renderMarkers, displaySize, preset, state.brand, state.disclaimer, state.displayMode, state.spotlightMode, state.spotlightSettings, state.compass);
      drawPendingOverlay(ctx, pendingPath, displaySize, preset.accent);
      // Draw resize/move handles for the selected marker
      if (state.selectedMarkerId) {
        const renderPlacements = getCardPlacements(renderMarkers, displaySize, ctx, preset);
        const rect = renderPlacements.get(state.selectedMarkerId);
        if (rect) drawCardHandles(ctx, rect, preset.accent);

        const selMarker = renderMarkers.find(m => m.id === state.selectedMarkerId);
        // Match onPointerDown's drag-eligibility rule: don't show vertex handles as if
        // draggable once a DIFFERENT path tool (e.g. ZONE) is active than the one that
        // made this marker (e.g. ROUTE) — they'd no longer respond to a click there.
        if (selMarker && (!isPathTool || selMarker.type === state.activeTool)) {
          const points = getMarkerPoints(selMarker).map(p => toPx(p.pos, displaySize));
          drawPointHandles(ctx, points, preset.accent);
        }
      }
    };

    if (imgRef.current && loadedSrc.current === state.image.displaySrc) {
      doRender(imgRef.current);
      return;
    }

    const img = new Image();
    img.src = state.image.displaySrc;
    img.onload = () => {
      imgRef.current = img;
      loadedSrc.current = state.image!.displaySrc;
      doRender(img);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, displaySize, pendingPath, dragTick]);

  const commitPath = useCallback(() => {
    const path = pendingPathRef.current;
    const minPts = state.activeTool === 'ZONE' ? 3 : 2;

    // Deduplicate the final point if it equals the previous (double-click artefact)
    const last = path[path.length - 1];
    const prev = path[path.length - 2];
    const cleaned = last && prev && last.x === prev.x && last.y === prev.y
      ? path.slice(0, -1)
      : path;

    if (cleaned.length < minPts) {
      setPendingPath([]);
      pendingPathRef.current = [];
      return;
    }

    const id = markerId();
    if (state.activeTool === 'ROUTE') {
      const m: RouteMarker = {
        id, type: 'ROUTE', order: state.markers.length + 1,
        layout: { auto: true, cardAnchor: null, arrowCtrl: null },
        path: cleaned,
        data: { name: 'Tuyến đường', style: 'solid' },
      };
      dispatch({ type: 'ADD_MARKER', marker: m });
    } else if (state.activeTool === 'ARROW') {
      const m: ArrowMarker = {
        id, type: 'ARROW', order: state.markers.length + 1,
        layout: { auto: true, cardAnchor: null, arrowCtrl: null },
        from: cleaned[0]!, to: cleaned[1]!,
        data: {},
      };
      dispatch({ type: 'ADD_MARKER', marker: m });
    } else {
      const m: ZoneMarker = {
        id, type: 'ZONE', order: state.markers.length + 1,
        layout: { auto: true, cardAnchor: null, arrowCtrl: null },
        path: cleaned,
        data: { name: 'Phân khu', opacity: 0.25 },
      };
      dispatch({ type: 'ADD_MARKER', marker: m });
    }
    dispatch({ type: 'SELECT_MARKER', id });
    setPendingPath([]);
    pendingPathRef.current = [];
  }, [state.activeTool, state.markers.length, dispatch]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Suppress click that immediately follows a drag
    if (suppressNextClick.current) { suppressNextClick.current = false; return; }
    if (!state.image || displaySize.w === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / displaySize.w;
    const ny = (e.clientY - rect.top) / displaySize.h;

    if (state.activeTool === 'UNIT') {
      const id = markerId();
      const marker: UnitMarker = {
        id, type: 'UNIT', order: state.markers.length + 1,
        point: { x: nx, y: ny }, radius: 0.07, status: 'available',
        layout: { auto: true, cardAnchor: null, arrowCtrl: null },
        data: { code: '' },
      };
      dispatch({ type: 'ADD_MARKER', marker });
      setPopover({ markerId: id, kind: 'UNIT', screenX: e.clientX, screenY: e.clientY });
      return;
    }

    if (state.activeTool === 'TEXT') {
      const id = markerId();
      const marker: TextMarker = {
        id, type: 'TEXT', order: state.markers.length + 1,
        point: { x: nx, y: ny },
        layout: { auto: true, cardAnchor: null, arrowCtrl: null },
        data: { text: '' },
      };
      dispatch({ type: 'ADD_MARKER', marker });
      setPopover({ markerId: id, kind: 'TEXT', screenX: e.clientX, screenY: e.clientY });
      return;
    }

    if (state.activeTool === 'POI') {
      const id = markerId();
      const marker: PoiMarker = {
        id, type: 'POI', order: state.markers.length + 1,
        point: { x: nx, y: ny },
        layout: { auto: true, cardAnchor: null, arrowCtrl: null },
        data: { icon: 'park', name: '' },
      };
      dispatch({ type: 'ADD_MARKER', marker });
      dispatch({ type: 'SELECT_MARKER', id });
      return;
    }

    // ROUTE / ZONE: timer-based double-click detection; ARROW: exactly 2 points, auto-commit
    if (isPathTool) {
      if (clickTimerRef.current !== null) {
        // Second click within DBLCLICK_MS → treat as double-click → commit
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        commitPath();
      } else {
        // Single click: add point
        const newPath = [...pendingPathRef.current, { x: nx, y: ny }];
        pendingPathRef.current = newPath;
        setPendingPath(newPath);
        if (state.activeTool === 'ARROW' && newPath.length >= 2) {
          commitPath();
          return;
        }
        clickTimerRef.current = window.setTimeout(() => {
          clickTimerRef.current = null;
        }, DBLCLICK_MS);
      }
    }
  }, [state, displaySize, dispatch, isPathTool, commitPath]);

  // ── Drag-card handlers (T-401 lite) ───────────────────────────────────────
  const SNAP_PX = 8;
  const RESIZE_ZONE = 18; // px from bottom-right corner that triggers resize

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!displaySize.w) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Point handles on the selected marker — works for any marker type's point(s).
    // Checked BEFORE the isPathTool bail-out so an existing ROUTE/ZONE/ARROW marker's
    // own vertices stay draggable even while that same tool is still active (the most
    // common case right after drawing one). Switching tools doesn't clear selection, so
    // once a DIFFERENT path tool is active (e.g. a ROUTE stays selected but the user
    // switched to ZONE), its handles must stop intercepting clicks meant to start the
    // new path — otherwise the old marker stays editable under the "wrong" tool.
    const selected = state.markers.find(m => m.id === state.selectedMarkerId);
    if (selected && (!isPathTool || selected.type === state.activeTool)) {
      const HANDLE_R = 14;
      for (const { ref, pos } of getMarkerPoints(selected)) {
        const p = toPx(pos, displaySize);
        if (Math.hypot(cx - p.x, cy - p.y) <= HANDLE_R) {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointDragRef.current = { markerId: selected.id, ref, active: false, startX: cx, startY: cy };
          suppressNextClick.current = true;
          return;
        }
      }
    }

    // A path tool being drawn takes over plain clicks (add-point flow in handleClick)
    // once we know the click wasn't on a drag handle above.
    if (isPathTool) return;

    for (const [id, cardRect] of cardPlacements.current) {
      if (cx >= cardRect.x && cx < cardRect.x + cardRect.w &&
          cy >= cardRect.y && cy < cardRect.y + cardRect.h) {
        e.currentTarget.setPointerCapture(e.pointerId);
        const isResize = cx > cardRect.x + cardRect.w - RESIZE_ZONE &&
                         cy > cardRect.y + cardRect.h - RESIZE_ZONE;
        const marker = state.markers.find(m => m.id === id) as import('../../types/index').UnitMarker | undefined;
        const initialCardScale = marker?.layout.cardScale ?? 1;
        dragRef.current = {
          markerId: id,
          mode: isResize ? 'resize' : 'move',
          offsetX: cx - cardRect.x, offsetY: cy - cardRect.y,
          startX: cx, startY: cy, active: false,
          initialCardScale,
          initialCardW: cardRect.w,
          initialCardH: cardRect.h,
          frameW: displaySize.w,
        };
        suppressNextClick.current = true;
        dispatch({ type: 'SELECT_MARKER', id });
        return;
      }
    }
  // state.activeTool is read directly in the body (not just via the isPathTool bool),
  // and isPathTool alone can stay `true` across a ROUTE→ZONE switch — so it must be
  // listed explicitly or this callback would keep a stale tool value after such a switch.
  }, [displaySize, isPathTool, state.markers, state.selectedMarkerId, state.activeTool, dispatch]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const pointDrag = pointDragRef.current;
    if (pointDrag) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (!pointDrag.active) {
        if (Math.hypot(cx - pointDrag.startX, cy - pointDrag.startY) < 3) return;
        pointDrag.active = true;
        setDragCursor('cursor-grabbing');
      }

      const nx = Math.max(0, Math.min(1, cx / displaySize.w));
      const ny = Math.max(0, Math.min(1, cy / displaySize.h));
      dragPointRef.current = { id: pointDrag.markerId, ref: pointDrag.ref, pos: { x: nx, y: ny } };
      setDragTick(t => t + 1);
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (!drag.active) {
      if (Math.hypot(cx - drag.startX, cy - drag.startY) < 5) return;
      drag.active = true;
      setDragCursor(drag.mode === 'resize' ? 'cursor-se-resize' : 'cursor-grabbing');
    }

    if (drag.mode === 'resize') {
      const deltaX    = cx - drag.startX;
      const newCardW  = Math.max(drag.initialCardW * 0.5, drag.initialCardW + deltaX);
      const newScale  = Math.max(0.5, Math.min(1.8, (newCardW / drag.initialCardW) * drag.initialCardScale));
      dragScaleRef.current = { id: drag.markerId, scale: newScale };
    } else {
      // Reuse the placement's own (possibly content-widened) size, not a fixed constant.
      const cardW  = drag.initialCardW;
      const cardH  = drag.initialCardH;
      const rawX   = Math.round((cx - drag.offsetX) / SNAP_PX) * SNAP_PX;
      const rawY   = Math.round((cy - drag.offsetY) / SNAP_PX) * SNAP_PX;
      const nx     = Math.max(0, Math.min((displaySize.w - cardW) / displaySize.w, rawX / displaySize.w));
      const ny     = Math.max(0, Math.min((displaySize.h - cardH) / displaySize.h, rawY / displaySize.h));
      dragPositionRef.current = { id: drag.markerId, pos: { x: nx, y: ny } };
    }
    setDragTick(t => t + 1);
  }, [displaySize]);

  const onPointerUp = useCallback(() => {
    const pointDrag = pointDragRef.current;
    if (pointDrag?.active && dragPointRef.current) {
      dispatch({ type: 'UPDATE_MARKER_POINT', id: pointDrag.markerId, ref: pointDrag.ref, point: dragPointRef.current.pos });
    }
    pointDragRef.current = null;
    dragPointRef.current = null;

    const drag = dragRef.current;
    if (drag?.active) {
      if (drag.mode === 'move' && dragPositionRef.current) {
        dispatch({ type: 'UPDATE_LAYOUT', id: drag.markerId, layout: { auto: false, cardAnchor: dragPositionRef.current.pos } });
      } else if (drag.mode === 'resize' && dragScaleRef.current) {
        dispatch({ type: 'UPDATE_LAYOUT', id: drag.markerId, layout: { auto: false, cardScale: dragScaleRef.current.scale } });
      }
    }
    dragRef.current = null;
    dragPositionRef.current = null;
    dragScaleRef.current = null;
    setDragCursor('cursor-crosshair');
  }, [dispatch]);

  const minPathPoints = state.activeTool === 'ZONE' ? 3 : 2;
  const canCommit = pendingPath.length >= minPathPoints;

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={displaySize.w}
        height={displaySize.h}
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`shadow-2xl rounded ${dragCursor}`}
      />

      {/* Pending-path HUD */}
      {isPathTool && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-neutral-300">
          <span>{pendingPath.length} điểm</span>
          {canCommit && (
            <button
              onClick={commitPath}
              className="ml-2 px-3 py-1 bg-yellow-400 text-black rounded-lg font-semibold text-xs"
            >
              Xong (Enter)
            </button>
          )}
          {pendingPath.length > 0 && (
            <button
              onClick={() => { setPendingPath([]); pendingPathRef.current = []; }}
              className="px-2 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-xs"
            >
              Huỷ (Esc)
            </button>
          )}
        </div>
      )}

      {popover && (
        <QuickInputPopover
          x={popover.screenX}
          y={popover.screenY}
          placeholder={popover.kind === 'TEXT' ? vi.step2.quickInputText : vi.step2.quickInput}
          onSubmit={value => {
            if (popover.kind === 'TEXT') {
              dispatch({ type: 'UPDATE_TEXT_DATA', id: popover.markerId, data: { text: value } });
            } else {
              dispatch({ type: 'UPDATE_UNIT_DATA', id: popover.markerId, data: { code: value } });
            }
            dispatch({ type: 'SELECT_MARKER', id: popover.markerId });
            setPopover(null);
          }}
          onCancel={() => {
            dispatch({ type: 'DELETE_MARKER', id: popover.markerId });
            setPopover(null);
          }}
        />
      )}
    </div>
  );
}

/** Draw selection outline + resize handle for a card being interacted with. */
function drawCardHandles(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  accent: string,
): void {
  const HS = 12; // handle square size px
  ctx.save();

  // Dashed selection border
  ctx.strokeStyle = accent;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
  ctx.setLineDash([]);

  // Bottom-right resize handle (yellow square)
  ctx.fillStyle   = accent;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(rect.x + rect.w - HS, rect.y + rect.h - HS, HS, HS, 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** Draw draggable handles at every editable point on the selected marker (works for a
 *  single point — UNIT/POI/TEXT — or several — ARROW's 2, a ROUTE/ZONE's path vertices). */
function drawPointHandles(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  accent: string,
): void {
  if (points.length === 0) return;
  const R = 7;
  ctx.save();

  if (points.length > 1) {
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i]!.x, points[i]!.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hollow ring, not a filled dot — a single-point marker (POI/TEXT/UNIT) renders its
  // label centred exactly on that point, so a solid fill would blot out its own text.
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth   = 3.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawPendingOverlay(
  ctx: CanvasRenderingContext2D,
  path: NormPoint[],
  frame: { w: number; h: number },
  accent: string,
): void {
  if (path.length === 0) return;
  const pts = path.map(p => ({ x: p.x * frame.w, y: p.y * frame.h }));

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (const pt of pts.slice(1)) ctx.lineTo(pt.x, pt.y);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const pt of pts) {
    ctx.fillStyle   = '#FFFFFF';
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
