import type { MarkerType } from '../../types/index';
import { vi } from '../../i18n/vi';

const TOOLS: Array<{ type: MarkerType; label: string; emoji: string; key: string }> = [
  { type: 'UNIT',  label: vi.step2.unit,  emoji: '🏠', key: '1' },
  { type: 'POI',   label: vi.step2.poi,   emoji: '📍', key: '2' },
  { type: 'ROUTE', label: vi.step2.route, emoji: '🛣', key: '3' },
  { type: 'ZONE',  label: vi.step2.zone,  emoji: '⬛', key: '4' },
  { type: 'ARROW', label: vi.step2.arrow, emoji: '➡️', key: '5' },
  { type: 'TEXT',  label: vi.step2.text,  emoji: '📝', key: '6' },
];

interface Props {
  activeTool: MarkerType;
  onToolChange: (tool: MarkerType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function MarkerToolbar({ activeTool, onToolChange, canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
      <span className="text-xs text-neutral-500 mr-2">{vi.step2.title}</span>
      {TOOLS.map(({ type, label, emoji, key }) => (
        <button
          key={type}
          type="button"
          onClick={() => onToolChange(type)}
          title={`${label} (${key})`}
          className={`
            min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium
            flex items-center gap-1.5 transition-colors
            ${
              activeTool === type
                ? 'bg-yellow-400 text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }
          `}
        >
          <span>{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
      <span className="ml-2 text-xs text-neutral-600">{vi.step2.hint}</span>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={`${vi.toolbar.undo} (Ctrl+Z)`}
          className="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 transition-colors"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={`${vi.toolbar.redo} (Ctrl+Shift+Z)`}
          className="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 transition-colors"
        >
          ↷
        </button>
      </div>
    </div>
  );
}
