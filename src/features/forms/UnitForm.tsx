import type { UnitMarker } from '../../types/index';
import { MAX_FIELD_LEN } from '../../types/index';
import type { SceneAction } from '../../hooks/useScene';
import { vi } from '../../i18n/vi';

interface Props {
  marker: UnitMarker;
  dispatch: React.Dispatch<SceneAction>;
  truncated: boolean;
}

const TEXT_FIELDS = [
  { key: 'area',    label: vi.fields.area,    placeholder: undefined as string | undefined },
  { key: 'rooms',   label: vi.fields.rooms,   placeholder: undefined as string | undefined },
  { key: 'orient',  label: vi.fields.orient,  placeholder: undefined as string | undefined },
  { key: 'view',    label: vi.fields.view,    placeholder: undefined as string | undefined },
  { key: 'price',   label: vi.fields.price,   placeholder: undefined as string | undefined },
  { key: 'loan',    label: vi.fields.loan,    placeholder: '65 tr/m2'  as string | undefined },
  { key: 'capital', label: vi.fields.capital, placeholder: '900 triệu' as string | undefined },
  { key: 'hook',    label: vi.fields.hook,    placeholder: undefined as string | undefined },
] as const;

type OptKey = typeof TEXT_FIELDS[number]['key'];

export default function UnitForm({ marker, dispatch, truncated }: Props) {
  const update = (patch: Partial<UnitMarker['data']>) =>
    dispatch({ type: 'UPDATE_UNIT_DATA', id: marker.id, data: patch });

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-300">{vi.fields.code}</h2>

      {truncated && (
        <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded px-2 py-1">
          {vi.warn.tooManyLines}
        </p>
      )}

      {/* Code — required */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.code} *</label>
        <input
          type="text"
          value={marker.data.code}
          maxLength={MAX_FIELD_LEN}
          placeholder="A2-12.05"
          onChange={e => update({ code: e.target.value })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      {/* Optional text fields */}
      {TEXT_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">{label}</label>
          <input
            type="text"
            value={marker.data[key as OptKey] ?? ''}
            maxLength={MAX_FIELD_LEN}
            placeholder={placeholder}
            onChange={e => update({ [key]: e.target.value || undefined } as Partial<UnitMarker['data']>)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
          />
        </div>
      ))}

      {/* Status */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.fields.status}</label>
        <select
          value={marker.status}
          onChange={e => dispatch({ type: 'UPDATE_UNIT_STATUS', id: marker.id, status: e.target.value as UnitMarker['status'] })}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
        >
          <option value="available">{vi.status.available || 'Còn bán'}</option>
          <option value="hold">{vi.status.hold}</option>
          <option value="sold">{vi.status.sold}</option>
        </select>
      </div>
    </div>
  );
}
