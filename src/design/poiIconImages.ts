import type { PoiIcon } from '../types/index';

/**
 * Custom raster/vector artwork for POI icons, keyed by icon type. Add an entry
 * here once artwork exists for that icon; any key without one keeps using the
 * hand-drawn path from POI_ICONS.
 */
const POI_ICON_IMAGE_SRC: Partial<Record<PoiIcon, string>> = {
  hospital: '/icons/poi/hospital.svg',
};

const cache = new Map<PoiIcon, HTMLImageElement>();
for (const [icon, src] of Object.entries(POI_ICON_IMAGE_SRC) as [PoiIcon, string][]) {
  const img = new Image();
  img.src = src;
  cache.set(icon, img);
}

/** Returns the custom icon image for this POI type once it has finished loading. */
export function getPoiIconImage(icon: PoiIcon): HTMLImageElement | undefined {
  const img = cache.get(icon);
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
}
