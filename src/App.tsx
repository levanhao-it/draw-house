import { useEffect, useRef, useState } from 'react';
import { useScene } from './hooks/useScene';
import type { UnitMarker, PoiMarker, RouteMarker, ZoneMarker, ArrowMarker, TextMarker, SpotlightMode, SceneImage, MarkerType } from './types/index';
import ImageDropzone from './features/upload/ImageDropzone';
import StageCanvas from './features/markers/StageCanvas';
import MarkerToolbar from './features/markers/MarkerToolbar';
import MarkerList from './features/markers/MarkerList';
import UnitForm from './features/forms/UnitForm';
import PoiForm from './features/forms/PoiForm';
import RouteForm from './features/forms/RouteForm';
import ZoneForm from './features/forms/ZoneForm';
import ArrowForm from './features/forms/ArrowForm';
import TextForm from './features/forms/TextForm';
import ExportPanel from './features/export/ExportPanel';
import PresetPicker from './features/presets/PresetPicker';
import BrandKitModal from './features/brand/BrandKitModal';
import { useAutosave } from './features/persistence/useAutosave';
import { loadSession } from './lib/storage';

const TOOL_SHORTCUTS: Record<string, MarkerType> = {
  '1': 'UNIT', '2': 'POI', '3': 'ROUTE', '4': 'ZONE', '5': 'ARROW', '6': 'TEXT',
};

function App() {
  const [state, dispatch, history] = useScene();
  const [showBrand, setShowBrand] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const didRestore = useRef(false);

  useAutosave(state);

  // Global shortcuts: Ctrl/Cmd+Z undo, +Shift/+Y redo, Delete removes selection, 1-6 switch tool.
  // Skipped entirely while typing in a field so native text-editing/undo isn't hijacked.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      );
      if (typing) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedMarkerId) {
        e.preventDefault();
        dispatch({ type: 'DELETE_MARKER', id: state.selectedMarkerId });
        return;
      }
      const tool = TOOL_SHORTCUTS[e.key];
      if (tool && state.image) dispatch({ type: 'SET_TOOL', tool });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch, state.selectedMarkerId, state.image]);

  // Restore last session on first mount (T-404)
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    void loadSession().then(restored => {
      if (!restored) return;
      const { snapshot, displaySrc, originalSrc } = restored;
      // Always restore brand kit
      dispatch({ type: 'UPDATE_BRAND', patch: snapshot.brand });
      // Restore full session only when image blobs are available
      if (snapshot.image && displaySrc && originalSrc) {
        const image: SceneImage = { ...snapshot.image, displaySrc, originalSrc };
        dispatch({
          type: 'RESTORE_SESSION',
          payload: {
            image,
            markers:      snapshot.markers,
            ratio:        snapshot.ratio,
            preset:       snapshot.preset,
            displayMode:  snapshot.displayMode,
            spotlightMode: snapshot.spotlightMode,
            brand:        snapshot.brand,
            disclaimer:   snapshot.disclaimer,
            step: 2,
          },
        });
      }
    });
  // dispatch is stable from useReducer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state.image) {
    return (
      <ImageDropzone
        onLoad={image => dispatch({ type: 'SET_IMAGE', image })}
      />
    );
  }
  const selected = state.markers.find(m => m.id === state.selectedMarkerId);
  const selectedUnit = selected?.type === 'UNIT' ? (selected as UnitMarker) : null;

  return (
    <>
    {showBrand && (
      <BrandKitModal brand={state.brand} dispatch={dispatch} onClose={() => setShowBrand(false)} />
    )}
    <div className="h-screen flex flex-col bg-neutral-950 text-white overflow-hidden">
      <MarkerToolbar
        activeTool={state.activeTool}
        onToolChange={tool => dispatch({ type: 'SET_TOOL', tool })}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <StageCanvas state={state} dispatch={dispatch} />
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col border-l border-neutral-800 overflow-y-auto">

          {/* Change image (T-401 UX) */}
          <div className="px-3 pt-2 pb-1 flex items-center justify-between border-b border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              {state.markers.length} marker{state.markers.length !== 1 ? 's' : ''}
            </span>
            {confirmClear ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400">Xoá tất cả?</span>
                <button type="button" onClick={() => { dispatch({ type: 'CLEAR_IMAGE' }); setConfirmClear(false); }}
                  className="h-6 px-2 rounded text-xs bg-red-600 text-white hover:bg-red-500">Đồng ý</button>
                <button type="button" onClick={() => setConfirmClear(false)}
                  className="h-6 px-2 rounded text-xs bg-neutral-700 text-neutral-300 hover:bg-neutral-600">Huỷ</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)}
                className="h-7 px-2 rounded text-xs text-neutral-500 hover:text-red-400 hover:bg-neutral-800">
                ↺ Đổi ảnh
              </button>
            )}
          </div>

          <MarkerList state={state} dispatch={dispatch} />

          {/* Spotlight mode toggle */}
          <div className="px-3 py-2 border-t border-neutral-800 flex gap-1">
            {([['normal', 'Bình thường'], ['spotlight', 'Spotlight']] as [SpotlightMode, string][]).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => dispatch({ type: 'SET_SPOTLIGHT_MODE', mode: m })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  state.spotlightMode === m
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-neutral-800">
            {selected?.type === 'UNIT' && (
            <>
              {selectedUnit && !selectedUnit.layout.auto && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'UPDATE_LAYOUT', id: selected.id, layout: { auto: true, cardAnchor: null } })}
                  className="mx-3 mt-2 h-8 px-3 rounded-lg text-xs text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10"
                >
                  ↩ Về tự động
                </button>
              )}
              <UnitForm
                marker={selected as UnitMarker}
                dispatch={dispatch}
                truncated={false}
              />
            </>
          )}
            {selected?.type === 'POI' && (
              <PoiForm marker={selected as PoiMarker} dispatch={dispatch} />
            )}
            {selected?.type === 'ROUTE' && (
              <RouteForm marker={selected as RouteMarker} dispatch={dispatch} />
            )}
            {selected?.type === 'ZONE' && (
              <ZoneForm marker={selected as ZoneMarker} dispatch={dispatch} />
            )}
            {selected?.type === 'ARROW' && (
              <ArrowForm marker={selected as ArrowMarker} dispatch={dispatch} />
            )}
            {selected?.type === 'TEXT' && (
              <TextForm marker={selected as TextMarker} dispatch={dispatch} />
            )}
            {!selected && (
              <div className="p-4 text-xs text-neutral-500">
                Chọn marker để chỉnh sửa thông tin.
              </div>
            )}
          </div>

          <PresetPicker current={state.preset} dispatch={dispatch} />

          {/* Brand Kit button (T-402) */}
          <div className="px-3 py-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setShowBrand(true)}
              className="w-full h-11 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 flex items-center justify-center gap-1.5"
            >
              🎨 Brand Kit
              {!state.brand.hotline && <span className="text-red-400">(☁️)</span>}
              {state.brand.hotline && <span className="text-yellow-400/70">• {state.brand.hotline}</span>}
            </button>
          </div>

          <ExportPanel state={state} dispatch={dispatch} />
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
