import { useState } from 'react';
import type { AppState, SceneAction } from '../../hooks/useScene';
import { useExport } from './useExport';
import { vi } from '../../i18n/vi';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<SceneAction>;
}

export default function ExportPanel({ state, dispatch }: Props) {
  const { exportPng, exporting, needsHotline, setNeedsHotline } = useExport(state);
  const [hotlineInput, setHotlineInput] = useState('');

  function saveHotline() {
    const val = hotlineInput.trim();
    if (!val) return;
    dispatch({ type: 'UPDATE_BRAND', patch: { hotline: val } });
    setNeedsHotline(false);
  }

  return (
    <div className="p-4 border-t border-neutral-800 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">{vi.step3.title}</h2>

      {/* Inline hotline entry */}
      {needsHotline && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-xs text-red-300">{vi.warn.needHotline}</p>
          <input
            type="text"
            value={hotlineInput}
            placeholder="0909 123 456"
            autoFocus
            maxLength={20}
            className="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1.5 text-white text-sm outline-none focus:border-yellow-400"
            onChange={e => setHotlineInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveHotline(); }}
          />
          <button
            type="button"
            onClick={saveHotline}
            disabled={!hotlineInput.trim()}
            className="self-start px-3 py-1 bg-yellow-400 text-black rounded text-xs font-semibold disabled:opacity-40"
          >
            Lưu &amp; tiếp tục
          </button>
        </div>
      )}

      {/* Hotline display when set */}
      {!needsHotline && !state.brand.hotline && (
        <button
          type="button"
          onClick={() => setNeedsHotline(true)}
          className="text-xs text-yellow-400 underline text-left"
        >
          + Điền hotline trước khi xuất
        </button>
      )}
      {state.brand.hotline && (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>☎️ {state.brand.hotline}</span>
          <button
            type="button"
            onClick={() => setNeedsHotline(true)}
            className="text-neutral-600 hover:text-yellow-400"
          >✒️</button>
        </div>
      )}

      {/* Check-position reminder (R9) */}
      <p className="text-xs text-yellow-400/70">⚠️ {vi.warn.checkPosition}</p>

      {/* Single export button — same size as original image */}
      <button
        type="button"
        disabled={exporting || !state.image}
        onClick={() => void exportPng()}
        className="
          min-h-[44px] bg-yellow-400 text-black font-semibold rounded-xl
          hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors text-sm
        "
      >
        {exporting ? '...' : vi.step3.export1}
        {state.image && !exporting && (
          <span className="ml-2 font-normal opacity-70 text-xs">
            {state.image.w}×{state.image.h}
          </span>
        )}
      </button>
    </div>
  );
}
