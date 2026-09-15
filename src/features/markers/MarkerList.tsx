import type { AppState, SceneAction } from '../../hooks/useScene';
import type { Marker, UnitMarker, PoiMarker, RouteMarker, ZoneMarker, ArrowMarker, TextMarker } from '../../types/index';

const TYPE_EMOJI: Record<string, string> = {
  UNIT:  '🏠',
  POI:   '📍',
  ROUTE: '🛣',
  ZONE:  '⬛',
  ARROW: '➡️',
  TEXT:  '📝',
};

function markerLabel(m: Marker): string {
  switch (m.type) {
    case 'UNIT':  return (m as UnitMarker).data.code || '(chưa nhập mã)';
    case 'POI':   return (m as PoiMarker).data.name || '(chưa nhập tên)';
    case 'ROUTE': return (m as RouteMarker).data.name || 'Tuyến đường';
    case 'ZONE':  return (m as ZoneMarker).data.name || 'Phân khu';
    case 'ARROW': return (m as ArrowMarker).data.label || 'Mũi tên';
    case 'TEXT':  return (m as TextMarker).data.text || '(chưa nhập văn bản)';
  }
}

interface Props {
  state: AppState;
  dispatch: React.Dispatch<SceneAction>;
}

export default function MarkerList({ state, dispatch }: Props) {
  const { markers, selectedMarkerId } = state;

  if (markers.length === 0) {
    return (
      <div className="p-4 text-xs text-neutral-500 italic">
        Bấm vào ảnh để thêm marker.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
        Danh sách marker
      </div>
      <ul className="flex flex-col divide-y divide-neutral-800/60">
        {markers.map((m, idx) => {
          const isSelected = m.id === selectedMarkerId;
          return (
            <li
              key={m.id}
              className={`
                flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                ${isSelected ? 'bg-yellow-400/10 border-l-2 border-yellow-400' : 'hover:bg-neutral-800/50'}
              `}
              onClick={() => dispatch({ type: 'SELECT_MARKER', id: m.id })}
            >
              {/* Order badge */}
              <span className="w-5 h-5 rounded-full bg-neutral-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {m.order}
              </span>
              {/* Type icon */}
              <span className="text-base">{TYPE_EMOJI[m.type]}</span>
              {/* Label */}
              <span className={`flex-1 text-xs truncate ${isSelected ? 'text-white font-medium' : 'text-neutral-300'}`}>
                {markerLabel(m)}
              </span>
              {/* Reorder buttons — wider tap area than the arrow glyph itself (fingertip-sized, not mouse-sized) */}
              <div className="flex flex-col shrink-0 touch-manipulation">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'REORDER_MARKERS', fromIndex: idx, toIndex: idx - 1 }); }}
                  className="w-7 h-4 flex items-center justify-center text-neutral-600 hover:text-neutral-300 disabled:opacity-20 text-[10px] leading-none"
                  title="Lên"
                >▲</button>
                <button
                  type="button"
                  disabled={idx === markers.length - 1}
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'REORDER_MARKERS', fromIndex: idx, toIndex: idx + 1 }); }}
                  className="w-7 h-4 flex items-center justify-center text-neutral-600 hover:text-neutral-300 disabled:opacity-20 text-[10px] leading-none"
                  title="Xuống"
                >▼</button>
              </div>
              {/* Delete */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_MARKER', id: m.id }); }}
                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors text-sm shrink-0 touch-manipulation"
                title="Xoá"
              >✕</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
