import type { RouteMarker } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';
import { vi } from '../../i18n/vi';

interface Props {
  marker: RouteMarker;
  dispatch: React.Dispatch<SceneAction>;
}

export default function RouteForm({ marker, dispatch }: Props) {
  const update = (patch: Partial<RouteMarker['data']>) =>
    dispatch({ type: 'UPDATE_ROUTE_DATA', id: marker.id, data: patch });

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">Tuyến đường</h2>
      <div className="text-xs text-neutral-500">{marker.path.length} điểm</div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.name}</label>
        <input
          type="text"
          value={marker.data.name}
          maxLength={MAX_FIELD_LEN}
          placeholder="Metro số 1..."
          onChange={e => update({ name: e.target.value })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      {/* Style */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.style}</label>
        <div className="flex gap-2">
          {(['solid', 'dashed'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => update({ style: s })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                marker.data.style === s
                  ? 'bg-yellow-400 text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {s === 'solid' ? 'Liền nét' : 'Đứt nét'}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Màu đường</label>
        <input
          type="color"
          value={marker.data.color ?? '#FFD400'}
          onChange={e => update({ color: e.target.value })}
          className="h-9 w-full rounded-lg border border-neutral-700 bg-neutral-800 cursor-pointer"
        />
      </div>
    </div>
  );
}
