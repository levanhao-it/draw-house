import type { PoiMarker, PoiIcon } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';
import { POI_ICON_LABELS } from '../../design/icons';
import { vi } from '../../i18n/vi';

const ALL_ICONS = Object.keys(POI_ICON_LABELS) as PoiIcon[];

interface Props {
  marker: PoiMarker;
  dispatch: React.Dispatch<SceneAction>;
}

export default function PoiForm({ marker, dispatch }: Props) {
  const update = (patch: Partial<PoiMarker['data']>) =>
    dispatch({ type: 'UPDATE_POI_DATA', id: marker.id, data: patch });

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">Tiện ích</h2>

      {/* Icon picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.icon}</label>
        <select
          value={marker.data.icon}
          onChange={e => update({ icon: e.target.value as PoiIcon })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        >
          {ALL_ICONS.map(icon => (
            <option key={icon} value={icon}>{POI_ICON_LABELS[icon]}</option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.name} *</label>
        <input
          type="text"
          value={marker.data.name}
          maxLength={MAX_FIELD_LEN}
          placeholder="Trường quốc tế..."
          onChange={e => update({ name: e.target.value })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      {/* Distance */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.dist}</label>
        <input
          type="text"
          value={marker.data.dist ?? ''}
          maxLength={MAX_FIELD_LEN}
          placeholder="500 m · 5 phút"
          onChange={e => update({ dist: e.target.value || undefined })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>
    </div>
  );
}
