import { useState, useCallback } from 'react';
import type { AppState } from '../../hooks/useScene';
import { getPreset } from '../../design/presets';
import { renderScene } from '../../render-core/index';
import { waitForFonts } from '../../lib/fonts';
import { downloadBlob } from '../../lib/download';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function useExport(state: AppState) {
  const [exporting, setExporting] = useState(false);
  const [needsHotline, setNeedsHotline] = useState(false);

  const exportPng = useCallback(async () => {
    if (!state.image) return;

    if (!state.brand.hotline.trim()) {
      setNeedsHotline(true);
      return;
    }

    setExporting(true);
    try {
      // Export at original image dimensions — no ratio crop, no scaling
      const frame = { w: state.image.w, h: state.image.h };

      const canvas = document.createElement('canvas');
      canvas.width  = frame.w;
      canvas.height = frame.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await waitForFonts();

      const img    = await loadImage(state.image.originalSrc);
      const preset = getPreset(state.preset);
      renderScene(ctx, img, state.markers, frame, preset, state.brand, state.disclaimer, state.displayMode, state.spotlightMode);

      canvas.toBlob(blob => {
        if (blob) downloadBlob(blob, 'vecan_export.png');
      }, 'image/png');
    } finally {
      setExporting(false);
    }
  }, [state]);

  return { exportPng, exporting, needsHotline, setNeedsHotline };
}
