import type { MarkerType } from '../../types/index';
import { vi } from '../../i18n/vi';

const TOOLS: Array<{ type: MarkerType; label: string; emoji: string }> = [
  { type: 'UNIT',  label: vi.step2.unit,  emoji: '🏠' },
  { type: 'POI',   label: vi.step2.poi,   emoji: '📍' },
  { type: 'ROUTE', label: vi.step2.route, emoji: '🛣' },
  { type: 'ZONE',  label: vi.step2.zone,  emoji: '⬛' },
];

interface Props {
  activeTool: MarkerType;
  onToolChange: (tool: MarkerType) => void;
}

export default function MarkerToolbar({ activeTool, onToolChange }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
      <span className="text-xs text-neutral-500 mr-2">{vi.step2.title}</span>
      {TOOLS.map(({ type, label, emoji }) => (
        <button
          key={type}
          type="button"
          onClick={() => onToolChange(type)}
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
    </div>
  );
}
