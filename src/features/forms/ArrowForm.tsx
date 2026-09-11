import type { ArrowMarker } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';

interface Props {
  marker: ArrowMarker;
  dispatch: React.Dispatch<SceneAction>;
}

export default function ArrowForm({ marker, dispatch }: Props) {
  const update = (patch: Partial<ArrowMarker['data']>) =>
    dispatch({ type: 'UPDATE_ARROW_DATA', id: marker.id, data: patch });

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">Mũi tên</h2>

      {/* Label — optional */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Nhãn (không bắt buộc)</label>
        <input
          type="text"
          value={marker.data.label ?? ''}
          maxLength={MAX_FIELD_LEN}
          placeholder="Hướng ra biển..."
          onChange={e => update({ label: e.target.value || undefined })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      {/* Color override */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Màu mũi tên</label>
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
