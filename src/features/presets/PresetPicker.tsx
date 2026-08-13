import type { CSSProperties, Dispatch } from 'react';
import type { PresetId } from '../../types/index';
import { PRESETS, type Preset } from '../../design/presets';
import type { SceneAction } from '../../hooks/useScene';

interface Props {
  current: PresetId;
  dispatch: Dispatch<SceneAction>;
}

function Thumbnail({ preset }: { preset: Preset }) {
  const radius = Math.max(4, Math.round(preset.cardRadius / 4));

  const borderStyle: CSSProperties = (() => {
    if (preset.cardEdge === 'goldBorder') return { border: `1.5px solid ${preset.accent}` };
    if (preset.cardEdge === 'grayBorder') return { border: '1px solid #DADCE0' };
    if (preset.cardEdge === 'softShadow') return { boxShadow: '0 2px 6px rgba(0,0,0,0.25)' };
    return {};
  })();

  return (
    <div
      className="relative flex h-11 w-full overflow-hidden"
      style={{ background: preset.cardBg, borderRadius: radius, ...borderStyle }}
    >
      {preset.cardEdge === 'accentBar' && (
        <div className="w-1 self-stretch shrink-0" style={{ background: preset.accent }} />
      )}
      <div className="flex-1 flex flex-col justify-center gap-[3px] px-1.5 py-1">
        {/* T1: code */}
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: preset.accent }} />
        {/* T2: body */}
        <div className="h-[3px] w-full rounded-full opacity-60" style={{ background: preset.textSecondary }} />
        <div className="h-[3px] w-2/3 rounded-full opacity-60" style={{ background: preset.textSecondary }} />
        {/* T3: price bar */}
        <div className="h-1.5 w-full rounded-sm mt-px" style={{ background: preset.accent, opacity: 0.55 }} />
      </div>
    </div>
  );
}

export default function PresetPicker({ current, dispatch }: Props) {
  return (
    <div className="px-3 py-2 border-t border-neutral-800">
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Preset</p>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map(preset => {
          const active = preset.id === current;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              aria-label={preset.label}
              onClick={() => dispatch({ type: 'SET_PRESET', preset: preset.id })}
              className={`flex flex-col gap-1 rounded-lg p-1 transition-all min-h-[44px] ${
                active
                  ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-neutral-950 bg-neutral-800'
                  : 'opacity-60 hover:opacity-100 hover:bg-neutral-800/50'
              }`}
            >
              <Thumbnail preset={preset} />
              <span
                className="text-[9px] font-medium text-center w-full leading-tight"
                style={{ color: active ? preset.accent : '#6b7280' }}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
