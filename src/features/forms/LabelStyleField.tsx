import { labelDx, type LabelStyle } from '../../types/index';
import { vi } from '../../i18n/vi';

interface Props {
  style: LabelStyle;
  update: (patch: Partial<LabelStyle>) => void;
}

const pill = (on: boolean) =>
  `flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
    on ? 'bg-yellow-400 text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
  }`;

/** Lettering controls shared by route labels and text markers: size, format, case, font, spacing, flat vs 3D block, 3D depth. */
export default function LabelStyleFields({ style, update }: Props) {
  const dx = labelDx(style);
  const sideText = Math.abs(dx) < 0.05
    ? vi.label.sideNone
    : `${dx > 0 ? vi.label.sideRight : vi.label.sideLeft} ${Math.round(Math.abs(dx) * 100)}%`;

  const emphasis = [
    { text: 'B', title: vi.label.bold,      face: 'font-bold',    on: style.labelBold !== false, flip: () => update({ labelBold: style.labelBold === false }) },
    { text: 'I', title: vi.label.italic,    face: 'italic',       on: !!style.labelItalic,       flip: () => update({ labelItalic: !style.labelItalic }) },
    { text: 'U', title: vi.label.underline, face: 'underline',    on: !!style.labelUnderline,    flip: () => update({ labelUnderline: !style.labelUnderline }) },
    { text: 'S', title: vi.label.strike,    face: 'line-through', on: !!style.labelStrike,       flip: () => update({ labelStrike: !style.labelStrike }) },
  ];

  // Capitals win over Title Case, matching labelText
  const casing = style.labelUpper ? 'upper' : style.labelTitle ? 'title' : 'asTyped';
  const cases = [
    { key: 'asTyped', text: vi.label.caseAsTyped, title: vi.label.caseAsTyped, patch: { labelUpper: false, labelTitle: false } },
    { key: 'title',   text: 'Aa',                  title: vi.label.caseTitle,   patch: { labelUpper: false, labelTitle: true } },
    { key: 'upper',   text: 'AA',                  title: vi.label.upper,       patch: { labelUpper: true, labelTitle: false } },
  ] as const;

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">
          {vi.label.size} — {Math.round((style.labelScale ?? 1) * 100)}%
        </label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={style.labelScale ?? 1}
          onChange={e => update({ labelScale: parseFloat(e.target.value) })}
          className="w-full accent-yellow-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.label.format}</label>
        <div className="flex gap-2">
          {emphasis.map(b => (
            <button
              key={b.text}
              type="button"
              title={b.title}
              aria-label={b.title}
              aria-pressed={b.on}
              onClick={b.flip}
              className={`${pill(b.on)} ${b.face}`}
            >
              {b.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.label.caseLabel}</label>
        <div className="flex gap-2">
          {cases.map(c => (
            <button
              key={c.key}
              type="button"
              title={c.title}
              aria-label={c.title}
              aria-pressed={casing === c.key}
              onClick={() => update(c.patch)}
              className={pill(casing === c.key)}
            >
              {c.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.label.fontLabel}</label>
        <div className="flex gap-2">
          {([false, true] as const).map(serif => (
            <button
              key={String(serif)}
              type="button"
              aria-pressed={!!style.labelSerif === serif}
              onClick={() => update({ labelSerif: serif })}
              className={`${pill(!!style.labelSerif === serif)} ${serif ? 'font-serif' : ''}`}
            >
              {serif ? vi.label.serif : vi.label.sans}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">
          {vi.label.spacing} — {Math.round((style.labelSpacing ?? 0) * 100)}%
        </label>
        <input
          type="range"
          min={-0.05}
          max={0.5}
          step={0.01}
          value={style.labelSpacing ?? 0}
          onChange={e => update({ labelSpacing: parseFloat(e.target.value) })}
          className="w-full accent-yellow-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">{vi.label.look}</label>
        <div className="flex gap-2">
          {([false, true] as const).map(is3d => (
            <button
              key={String(is3d)}
              type="button"
              aria-pressed={!!style.label3d === is3d}
              onClick={() => update({ label3d: is3d })}
              className={pill(!!style.label3d === is3d)}
            >
              {is3d ? vi.label.solid3d : vi.label.flat}
            </button>
          ))}
        </div>
      </div>

      {style.label3d && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">
              {vi.label.depth3d} — {Math.round((style.label3dDepth ?? 1) * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={style.label3dDepth ?? 1}
              onChange={e => update({ label3dDepth: parseFloat(e.target.value) })}
              className="w-full accent-yellow-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">
              {vi.label.side3d} — {sideText}
            </label>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={dx}
              onChange={e => update({ label3dDx: parseFloat(e.target.value) })}
              className="w-full accent-yellow-400"
            />
          </div>
        </>
      )}
    </>
  );
}
