import { useState } from 'react';
import type { SceneAction } from '../../hooks/useScene';
import type { CompassSettings, OverlayCorner } from '../../types/index';
import { vi } from '../../i18n/vi';

interface Props {
  compass: CompassSettings;
  dispatch: React.Dispatch<SceneAction>;
  onClose: () => void;
}

const CORNERS: Array<{ value: OverlayCorner; label: string }> = [
  { value: 'tl', label: 'Trên trái' },
  { value: 'tr', label: 'Trên phải' },
  { value: 'bl', label: 'Dưới trái' },
  { value: 'br', label: 'Dưới phải' },
];

export default function CompassModal({ compass, dispatch, onClose }: Props) {
  const [draft, setDraft] = useState<CompassSettings>(compass);
  const update = (patch: Partial<CompassSettings>) => setDraft(d => ({ ...d, ...patch }));

  function save() {
    dispatch({ type: 'SET_COMPASS', patch: draft });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{vi.compass.title}</h2>
          <button type="button" onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed -mt-2">{vi.compass.hint}</p>

        <label className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">{vi.compass.show}</span>
          <input type="checkbox" checked={draft.show}
            onChange={e => update({ show: e.target.checked })}
            className="w-5 h-5 accent-yellow-400" />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400">{vi.compass.corner}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {CORNERS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => update({ corner: value })}
                className={`h-11 rounded-lg text-xs font-medium transition-colors ${
                  draft.corner === value
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">{vi.compass.north} — {draft.northDeg}°</span>
          <input type="range" min={0} max={359} step={1} value={draft.northDeg}
            onChange={e => update({ northDeg: parseInt(e.target.value, 10) })}
            className="w-full accent-red-500" />
        </label>

        <div className="flex flex-col gap-1">
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-400">{vi.compass.showSun}</span>
            <input type="checkbox" checked={draft.showSun}
              onChange={e => update({ showSun: e.target.checked })}
              className="w-5 h-5 accent-yellow-400" />
          </label>
          {draft.showSun && (
            <>
              <span className="text-xs text-neutral-500">{vi.compass.sun} — {draft.sunDeg}°</span>
              <input type="range" min={0} max={359} step={1} value={draft.sunDeg}
                onChange={e => update({ sunDeg: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-400" />
            </>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-400">{vi.compass.showWind}</span>
            <input type="checkbox" checked={draft.showWind}
              onChange={e => update({ showWind: e.target.checked })}
              className="w-5 h-5 accent-yellow-400" />
          </label>
          {draft.showWind && (
            <>
              <span className="text-xs text-neutral-500">{vi.compass.wind} — {draft.windDeg}°</span>
              <input type="range" min={0} max={359} step={1} value={draft.windDeg}
                onChange={e => update({ windDeg: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400" />
            </>
          )}
        </div>

        <button type="button" onClick={save}
          className="h-11 bg-yellow-400 text-black rounded-xl font-semibold text-sm">
          {vi.compass.save}
        </button>
      </div>
    </div>
  );
}
