import { useState, useCallback } from 'react';
import type { SceneImage } from '../../types/index';
import { classifyImage } from './classifyImage';
import { vi } from '../../i18n/vi';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_DISPLAY_PX = 2560;

async function makeDisplaySrc(file: File, bmp: ImageBitmap): Promise<string> {
  if (Math.max(bmp.width, bmp.height) <= MAX_DISPLAY_PX) {
    return URL.createObjectURL(file);
  }
  const scale = MAX_DISPLAY_PX / Math.max(bmp.width, bmp.height);
  const oc = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  // Non-null assertion safe: OffscreenCanvas always supports '2d'
  const ctx = oc.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, oc.width, oc.height);
  const blob = await oc.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
  return URL.createObjectURL(blob);
}

export function useImageLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File): Promise<SceneImage | null> => {
    setLoading(true);
    setError(null);

    if (file.size > MAX_BYTES) {
      setError(vi.warn.imageTooLarge);
      setLoading(false);
      return null;
    }

    try {
      const bmp = await createImageBitmap(file);
      const kind = classifyImage(bmp);
      const { width: w, height: h } = bmp;
      const originalSrc = URL.createObjectURL(file);
      const displaySrc = await makeDisplaySrc(file, bmp);
      bmp.close();

      return { id: crypto.randomUUID(), kind, w, h, displaySrc, originalSrc };
    } catch {
      setError('Không thể đọc ảnh. Thử lại với file JPG/PNG/WebP khác.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loadFile, loading, error };
}
