// G-2: this file is pure — no React, no store, no window/document. ctx is passed in.
import { drawBackground } from './layers/backgroundLayer';
import { drawEffect } from './layers/effectLayer';
import { drawMarkers } from './layers/markerLayer';
import { drawBrand } from './layers/brandLayer';
import type { Marker, BrandKit, UnitMarker, DisplayMode, SpotlightMode } from '../types/index';
import type { Preset } from '../design/presets';
import type { Size } from './geom';

/**
 * Single render function used by BOTH preview and export — guarantees WYSIWYG.
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
    drawEffect(ctx, frame, unitMarkers, preset);
  }

  const truncatedIds = drawMarkers(ctx, markers, frame, preset, displayMode);

  drawBrand(ctx, frame, brand, disclaimer, preset);

  return truncatedIds;
}
