import { useState } from 'react';
import type { AppState, SceneAction } from '../../hooks/useScene';
import { useExport } from './useExport';
import { useAnimatedExport } from './useAnimatedExport';
import { planClip } from './clipPlan';
import { vi } from '../../i18n/vi';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<SceneAction>;
}

export default function ExportPanel({ state, dispatch }: Props) {
  const { exportPng, exporting, needsHotline, setNeedsHotline } = useExport(state);
  const { exportGif, exportVideo, exporting: exportingAnim, progress } = useAnimatedExport(state);
  const [hotlineInput, setHotlineInput] = useState('');
  const [holdSec, setHoldSec] = useState(1);
  const [cameraMode, setCameraMode] = useState<'single' | 'story'>('single');
  const clipSec = planClip(state.markers, holdSec, state.brand.hotline.trim().length > 0).durationSec;

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
            className="self-start min-h-[36px] px-4 py-2 bg-yellow-400 text-black rounded-lg text-xs font-semibold disabled:opacity-40 touch-manipulation"
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
            className="w-8 h-8 flex items-center justify-center shrink-0 text-neutral-600 hover:text-yellow-400 touch-manipulation"
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

      {/* Animated (video/GIF) export — marker reveal + Ken Burns zoom */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-300">{vi.video.title}</h3>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">{vi.video.holdPerElement} — {holdSec}s</label>
          <input
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={holdSec}
            disabled={exportingAnim}
            onChange={e => setHoldSec(parseFloat(e.target.value))}
            className="w-full accent-yellow-400"
          />
          <p className="text-xs text-neutral-500">{vi.video.totalDuration} ≈ {Math.round(clipSec)}s</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">{vi.video.cameraMode}</label>
          <div className="flex gap-1">
            {([['single', vi.video.cameraSingle], ['story', vi.video.cameraStory]] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                disabled={exportingAnim}
                onClick={() => setCameraMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  cameraMode === m
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={exportingAnim || !state.image}
            onClick={() => void exportGif(holdSec, cameraMode)}
            className="flex-1 min-h-[44px] bg-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {vi.video.exportGif}
          </button>
          <button
            type="button"
            disabled={exportingAnim || !state.image}
            onClick={() => void exportVideo(holdSec, cameraMode)}
            className="flex-1 min-h-[44px] bg-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {vi.video.exportVideo}
          </button>
        </div>
        {exportingAnim && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-[width]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span>{vi.video.exporting} {Math.round(progress * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
