import type { TextMarker } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';
import type { Preset } from '../../design/presets';
import LabelStyleFields from './LabelStyleField';
import { vi } from '../../i18n/vi';

interface Props {
  marker: TextMarker;
  dispatch: React.Dispatch<SceneAction>;
  preset: Preset;
}

export default function TextForm({ marker, dispatch, preset }: Props) {
  const update = (patch: Partial<TextMarker['data']>) =>
    dispatch({ type: 'UPDATE_TEXT_DATA', id: marker.id, data: patch });
  const angle = marker.data.angle ?? 0;

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
          onChange={e => update({ text: e.target.value })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      <LabelStyleFields style={marker.data} update={update} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.label.color}</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={marker.data.color ?? (marker.data.label3d ? preset.accent : preset.textPrimary)}
            onChange={e => update({ color: e.target.value })}
            className="h-9 flex-1 rounded-lg border border-neutral-700 bg-neutral-800 cursor-pointer"
          />
          {marker.data.color && (
            <button
              type="button"
              onClick={() => update({ color: undefined })}
              className="px-3 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              {vi.label.colorReset}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.label.angle} — {angle}°</label>
        <input
          type="range"
          min={-90}
          max={90}
          step={1}
          value={angle}
          onChange={e => update({ angle: parseInt(e.target.value, 10) })}
          className="w-full accent-yellow-400"
        />
      </div>

      <p className="text-[11px] text-neutral-500">
        Mặc định nền và màu chữ theo preset đang chọn; chọn màu để ghi đè cho riêng chữ này.
      </p>
    </div>
  );
}
