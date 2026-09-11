import { useReducer, type Dispatch } from 'react';
import type {
  Marker, UnitMarker, PoiMarker, RouteMarker, ZoneMarker, ArrowMarker, TextMarker,
  SceneImage, Ratio, PresetId, BrandKit, MarkerType, DisplayMode, SpotlightMode, SpotlightSettings,
  CompassSettings, LayoutOverride, NormPoint,
} from '../types/index';
import { DEFAULT_DISCLAIMER, DEFAULT_SPOTLIGHT_SETTINGS, DEFAULT_COMPASS } from '../types/index';
import { withMarkerPoint, type PointRef } from '../types/markerPoints';

export interface AppState {
  image: SceneImage | null;
  markers: Marker[];
  selectedMarkerId: string | null;
  step: 1 | 2 | 3;
  activeTool: MarkerType;
  ratio: Ratio;
  preset: PresetId;
  displayMode: DisplayMode;
  spotlightMode: SpotlightMode;
  spotlightSettings: SpotlightSettings;
  compass: CompassSettings;
  brand: BrandKit;
  disclaimer: string;
}

export type ContentAction =
  | { type: 'SET_IMAGE'; image: SceneImage }
  | { type: 'ADD_MARKER'; marker: Marker }
  | { type: 'UPDATE_UNIT_DATA'; id: string; data: Partial<UnitMarker['data']> }
  | { type: 'UPDATE_UNIT_STATUS'; id: string; status: UnitMarker['status'] }
  | { type: 'UPDATE_UNIT_RADIUS'; id: string; radius: number }
  | { type: 'UPDATE_POI_DATA'; id: string; data: Partial<PoiMarker['data']> }
  | { type: 'UPDATE_ROUTE_DATA'; id: string; data: Partial<RouteMarker['data']> }
  | { type: 'UPDATE_ZONE_DATA'; id: string; data: Partial<ZoneMarker['data']> }
  | { type: 'UPDATE_ARROW_DATA'; id: string; data: Partial<ArrowMarker['data']> }
  | { type: 'UPDATE_MARKER_POINT'; id: string; ref: PointRef; point: NormPoint }
  | { type: 'UPDATE_TEXT_DATA'; id: string; data: Partial<TextMarker['data']> }
  | { type: 'DELETE_MARKER'; id: string }
  | { type: 'SELECT_MARKER'; id: string | null }
  | { type: 'SET_TOOL'; tool: MarkerType }
  | { type: 'SET_RATIO'; ratio: Ratio }
  | { type: 'SET_PRESET'; preset: PresetId }
  | { type: 'SET_DISPLAY_MODE'; mode: DisplayMode }
  | { type: 'SET_SPOTLIGHT_MODE'; mode: SpotlightMode }
  | { type: 'SET_SPOTLIGHT_SETTINGS'; patch: Partial<SpotlightSettings> }
  | { type: 'SET_COMPASS'; patch: Partial<CompassSettings> }
  | { type: 'REORDER_MARKERS'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_BRAND'; patch: Partial<BrandKit> }
  | { type: 'UPDATE_LAYOUT'; id: string; layout: Partial<LayoutOverride> }
  | { type: 'RESTORE_SESSION'; payload: Partial<AppState> }
  | { type: 'CLEAR_IMAGE' };

/** Public action type: content actions plus history control (kept separate so the
 *  base reducer's switch stays exhaustive over content actions only). */
export type SceneAction = ContentAction | { type: 'UNDO' } | { type: 'REDO' };

const INITIAL_BRAND: BrandKit = {
  logoCorner: 'br',
  hotline: '',
  watermark: { enabled: false, opacity: 0.1 },
};

export const INITIAL_STATE: AppState = {
  image: null,
  markers: [],
  selectedMarkerId: null,
  step: 1,
  activeTool: 'UNIT',
  ratio: '4:5',
  preset: 'neon_spotlight',
  displayMode: 'auto',
  spotlightMode: 'spotlight',
  spotlightSettings: DEFAULT_SPOTLIGHT_SETTINGS,
  compass: DEFAULT_COMPASS,
  brand: INITIAL_BRAND,
  disclaimer: DEFAULT_DISCLAIMER,
};

function reindexOrder(markers: Marker[]): Marker[] {
  return markers.map((m, i) => ({ ...m, order: i + 1 }));
}

function reducer(state: AppState, action: ContentAction): AppState {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...INITIAL_STATE, image: action.image, step: 2, brand: state.brand };

    case 'ADD_MARKER': {
      const markers = reindexOrder([...state.markers, action.marker]);
      return { ...state, markers, selectedMarkerId: action.marker.id };
    }

    case 'UPDATE_UNIT_DATA': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'UNIT'
          ? { ...m, data: { ...m.data, ...action.data } }
          : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_UNIT_STATUS': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'UNIT' ? { ...m, status: action.status } : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_UNIT_RADIUS': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'UNIT' ? { ...m, radius: action.radius } : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_POI_DATA': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'POI'
          ? { ...m, data: { ...m.data, ...action.data } }
          : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_ROUTE_DATA': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'ROUTE'
          ? { ...m, data: { ...m.data, ...action.data } }
          : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_ZONE_DATA': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'ZONE'
          ? { ...m, data: { ...m.data, ...action.data } }
          : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_ARROW_DATA': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'ARROW'
          ? { ...m, data: { ...m.data, ...action.data } }
          : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_MARKER_POINT': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id ? withMarkerPoint(m, action.ref, action.point) : m,
      );
      return { ...state, markers };
    }

    case 'UPDATE_TEXT_DATA': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id && m.type === 'TEXT'
          ? { ...m, data: { ...m.data, ...action.data } }
          : m,
      );
      return { ...state, markers };
    }

    case 'DELETE_MARKER': {
      const markers = reindexOrder(state.markers.filter(m => m.id !== action.id));
      const selectedMarkerId =
        state.selectedMarkerId === action.id ? null : state.selectedMarkerId;
      return { ...state, markers, selectedMarkerId };
    }

    case 'SELECT_MARKER':
      return { ...state, selectedMarkerId: action.id };

    case 'SET_TOOL':
      return { ...state, activeTool: action.tool };

    case 'SET_RATIO':
      return { ...state, ratio: action.ratio };

    case 'SET_PRESET':
      return { ...state, preset: action.preset };

    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.mode };

    case 'SET_SPOTLIGHT_MODE':
      return { ...state, spotlightMode: action.mode };

    case 'SET_SPOTLIGHT_SETTINGS':
      return { ...state, spotlightSettings: { ...state.spotlightSettings, ...action.patch } };

    case 'SET_COMPASS':
      return { ...state, compass: { ...state.compass, ...action.patch } };

    case 'REORDER_MARKERS': {
      const arr = [...state.markers];
      const [moved] = arr.splice(action.fromIndex, 1);
      if (!moved) return state;
      arr.splice(action.toIndex, 0, moved);
      return { ...state, markers: reindexOrder(arr) };
    }

    case 'UPDATE_BRAND':
      return { ...state, brand: { ...state.brand, ...action.patch } };

    case 'UPDATE_LAYOUT': {
      const markers = state.markers.map((m): Marker =>
        m.id === action.id ? { ...m, layout: { ...m.layout, ...action.layout } } : m,
      );
      return { ...state, markers };
    }

    case 'RESTORE_SESSION':
      // Merge (not overwrite) spotlightSettings/compass — old saved sessions predate these
      // fields and partial payloads shouldn't wipe out the other defaults with `undefined`.
      return {
        ...INITIAL_STATE,
        ...action.payload,
        spotlightSettings: { ...INITIAL_STATE.spotlightSettings, ...action.payload.spotlightSettings },
        compass: { ...INITIAL_STATE.compass, ...action.payload.compass },
      };

    case 'CLEAR_IMAGE':
      return { ...INITIAL_STATE, brand: state.brand };
  }
}

export interface HistoryState {
  past: AppState[];
  present: AppState;
  future: AppState[];
}

const MAX_HISTORY = 30;
// Selection/tool changes aren't "content" — recording them would make Ctrl+Z feel broken.
const NON_HISTORY_TYPES = new Set<ContentAction['type']>(['SELECT_MARKER', 'SET_TOOL']);
// Loading a different project/image invalidates any earlier history entirely.
const RESET_HISTORY_TYPES = new Set<ContentAction['type']>(['SET_IMAGE', 'CLEAR_IMAGE', 'RESTORE_SESSION']);

export function historyReducer(hs: HistoryState, action: SceneAction): HistoryState {
  if (action.type === 'UNDO') {
    const prev = hs.past[hs.past.length - 1];
    if (!prev) return hs;
    return { past: hs.past.slice(0, -1), present: prev, future: [hs.present, ...hs.future].slice(0, MAX_HISTORY) };
  }
  if (action.type === 'REDO') {
    const next = hs.future[0];
    if (!next) return hs;
    return { past: [...hs.past, hs.present].slice(-MAX_HISTORY), present: next, future: hs.future.slice(1) };
  }

  const nextPresent = reducer(hs.present, action);
  if (nextPresent === hs.present) return hs;
  if (RESET_HISTORY_TYPES.has(action.type)) return { past: [], present: nextPresent, future: [] };
  if (NON_HISTORY_TYPES.has(action.type)) return { ...hs, present: nextPresent };
  return { past: [...hs.past, hs.present].slice(-MAX_HISTORY), present: nextPresent, future: [] };
}

export interface HistoryInfo {
  canUndo: boolean;
  canRedo: boolean;
}

export function useScene(): [AppState, Dispatch<SceneAction>, HistoryInfo] {
  const [hs, dispatch] = useReducer(historyReducer, { past: [], present: INITIAL_STATE, future: [] });
  return [hs.present, dispatch, { canUndo: hs.past.length > 0, canRedo: hs.future.length > 0 }];
}
