// G-2: this file is pure — no React, no store, no window/document. ctx is passed in.
import { drawBackground } from './layers/backgroundLayer';
import { drawEffect } from './layers/effectLayer';
import { drawMarkers } from './layers/markerLayer';
import { drawBrand } from './layers/brandLayer';
import { drawCompass } from './layers/compassLayer';
import { FULL_REVEAL, type MarkerReveal } from './animation';
import { DEFAULT_SPOTLIGHT_SETTINGS, DEFAULT_COMPASS, type Marker, type BrandKit, type UnitMarker, type DisplayMode, type SpotlightMode, type SpotlightSettings, type CompassSettings } from '../types/index';
import type { Preset } from '../design/presets';
import type { Size } from './geom';

/**
 * Single render function used by BOTH preview and export — guarantees WYSIWYG.
 * `revealOf` (default: always fully revealed) drives each marker's own entrance effect —
 * used by the animated (video/GIF) export for a one-by-one reveal; a no-op elsewhere.
 * Returns IDs of markers whose card content was truncated.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  markers: Marker[],
  frame: Size,
  preset: Preset,
  brand: BrandKit,
  disclaimer: string,
  displayMode: DisplayMode = 'auto',
  spotlightMode: SpotlightMode = 'spotlight',
  spotlightSettings: SpotlightSettings = DEFAULT_SPOTLIGHT_SETTINGS,
  compass: CompassSettings = DEFAULT_COMPASS,
  revealOf: (id: string) => MarkerReveal = () => FULL_REVEAL,
): string[] {
  ctx.clearRect(0, 0, frame.w, frame.h);

  if (!img) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, frame.w, frame.h);
    return [];
  }

  drawBackground(ctx, img, frame);

  if (spotlightMode === 'spotlight') {
    const unitMarkers = markers.filter((m): m is UnitMarker => m.type === 'UNIT');
    drawEffect(ctx, frame, unitMarkers, preset, spotlightSettings, revealOf);
  }

  const truncatedIds = drawMarkers(ctx, markers, frame, preset, displayMode, revealOf);

  drawCompass(ctx, frame, compass);
  drawBrand(ctx, frame, brand, disclaimer, preset);

  return truncatedIds;
}
