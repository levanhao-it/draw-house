import type { ZoneMarker } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';
import { vi } from '../../i18n/vi';

interface Props {
  marker: ZoneMarker;
  dispatch: React.Dispatch<SceneAction>;
}

export default function ZoneForm({ marker, dispatch }: Props) {
  const update = (patch: Partial<ZoneMarker['data']>) =>
    dispatch({ type: 'UPDATE_ZONE_DATA', id: marker.id, data: patch });

  const opacity = marker.data.opacity ?? 0.25;

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">Phân khu</h2>
      <div className="text-xs text-neutral-500">{marker.path.length} điểm</div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.name}</label>
        <input
          type="text"
          value={marker.data.name}
          maxLength={MAX_FIELD_LEN}
          placeholder="Khu A..."
          onChange={e => update({ name: e.target.value })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      {/* Fill color */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.fill}</label>
        <input
          type="color"
          value={marker.data.fill ?? '#FFD400'}
          onChange={e => update({ fill: e.target.value })}
          className="h-9 w-full rounded-lg border border-neutral-700 bg-neutral-800 cursor-pointer"
        />
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">
          {vi.fields.opacity} — {Math.round(opacity * 100)}%
        </label>
        <input
          type="range"
          min={0.05}
          max={0.8}
          step={0.05}
          value={opacity}
          onChange={e => update({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-yellow-400"
        />
      </div>
    </div>
  );
}
