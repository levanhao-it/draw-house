import { useRef, useCallback } from 'react';
import type { SceneImage } from '../../types/index';
import { useImageLoader } from './useImageLoader';
import { vi } from '../../i18n/vi';

interface Props {
  onLoad: (image: SceneImage) => void;
}

export default function ImageDropzone({ onLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loadFile, loading, error } = useImageLoader();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const img = await loadFile(file);
    if (img) onLoad(img);
  }, [loadFile, onLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = e.clipboardData.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-8"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onPaste={handlePaste}
    >
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">VeCan Studio</h1>
      <p className="text-neutral-400 text-sm mb-8">{vi.step1.title}</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="
          w-full max-w-md h-48 border-2 border-dashed border-neutral-600 rounded-2xl
          flex flex-col items-center justify-center gap-3 cursor-pointer
          hover:border-yellow-400 hover:bg-yellow-400/5 transition-colors
          disabled:opacity-50 disabled:cursor-wait
        "
      >
        <span className="text-4xl">{loading ? '⏳' : '🖼'}</span>
        <span className="text-center text-sm text-neutral-300">{vi.step1.drop}</span>
        <span className="text-xs text-neutral-500">{vi.step1.hint}</span>
      </button>

      {error && (
        <p className="mt-4 text-red-400 text-sm">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
