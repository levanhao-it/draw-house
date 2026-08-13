import { useReducer, type Dispatch } from 'react';
import type {
  Marker, UnitMarker, PoiMarker, RouteMarker, ZoneMarker,
  SceneImage, Ratio, PresetId, BrandKit, MarkerType, DisplayMode, SpotlightMode,
  LayoutOverride,
} from '../types/index';
import { DEFAULT_DISCLAIMER } from '../types/index';

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
  brand: BrandKit;
  disclaimer: string;
}

export type SceneAction =
  | { type: 'SET_IMAGE'; image: SceneImage }
  | { type: 'ADD_MARKER'; marker: Marker }
  | { type: 'UPDATE_UNIT_DATA'; id: string; data: Partial<UnitMarker['data']> }
  | { type: 'UPDATE_UNIT_STATUS'; id: string; status: UnitMarker['status'] }
  | { type: 'UPDATE_POI_DATA'; id: string; data: Partial<PoiMarker['data']> }
  | { type: 'UPDATE_ROUTE_DATA'; id: string; data: Partial<RouteMarker['data']> }
  | { type: 'UPDATE_ZONE_DATA'; id: string; data: Partial<ZoneMarker['data']> }
  | { type: 'DELETE_MARKER'; id: string }
  | { type: 'SELECT_MARKER'; id: string | null }
  | { type: 'SET_TOOL'; tool: MarkerType }
  | { type: 'SET_RATIO'; ratio: Ratio }
  | { type: 'SET_PRESET'; preset: PresetId }
  | { type: 'SET_DISPLAY_MODE'; mode: DisplayMode }
  | { type: 'SET_SPOTLIGHT_MODE'; mode: SpotlightMode }
  | { type: 'REORDER_MARKERS'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_BRAND'; patch: Partial<BrandKit> }
  | { type: 'UPDATE_LAYOUT'; id: string; layout: Partial<LayoutOverride> }
  | { type: 'RESTORE_SESSION'; payload: Partial<AppState> }
  | { type: 'CLEAR_IMAGE' };

const INITIAL_BRAND: BrandKit = {
  logoCorner: 'br',
  hotline: '',
  watermark: { enabled: false, opacity: 0.1 },
};

const INITIAL_STATE: AppState = {
  image: null,
  markers: [],
  selectedMarkerId: null,
  step: 1,
  activeTool: 'UNIT',
  ratio: '4:5',
  preset: 'neon_spotlight',
  displayMode: 'auto',
  spotlightMode: 'spotlight',
  brand: INITIAL_BRAND,
  disclaimer: DEFAULT_DISCLAIMER,
};

function reindexOrder(markers: Marker[]): Marker[] {
  return markers.map((m, i) => ({ ...m, order: i + 1 }));
}

function reducer(state: AppState, action: SceneAction): AppState {
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
      return { ...INITIAL_STATE, ...action.payload };

    case 'CLEAR_IMAGE':
      return { ...INITIAL_STATE, brand: state.brand };
  }
}

export function useScene(): [AppState, Dispatch<SceneAction>] {
  return useReducer(reducer, INITIAL_STATE);
}
