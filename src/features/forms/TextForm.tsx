import type { TextMarker } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';

interface Props {
  marker: TextMarker;
  dispatch: React.Dispatch<SceneAction>;
}

export default function TextForm({ marker, dispatch }: Props) {
  const update = (text: string) =>
    dispatch({ type: 'UPDATE_TEXT_DATA', id: marker.id, data: { text } });

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">Văn bản</h2>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Nội dung</label>
        <input
          type="text"
          value={marker.data.text}
          maxLength={MAX_FIELD_LEN}
          placeholder="Hồ bơi vô cực..."
          onChange={e => update(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      <p className="text-[11px] text-neutral-500">
        Nền và màu chữ luôn theo preset đang chọn để đồng bộ phong cách.
      </p>
    </div>
  );
}
