import { useState, useRef } from 'react';
import type { SceneAction } from '../../hooks/useScene';
import type { BrandKit } from '../../types/index';
import { vi } from '../../i18n/vi';

interface Props {
  brand: BrandKit;
  dispatch: React.Dispatch<SceneAction>;
  onClose: () => void;
}

const CORNERS: Array<{ value: BrandKit['logoCorner']; label: string }> = [
  { value: 'tl', label: 'Trên trái' },
  { value: 'tr', label: 'Trên phải' },
  { value: 'bl', label: 'Dưới trái' },
  { value: 'br', label: 'Dưới phải' },
];

export default function BrandKitModal({ brand, dispatch, onClose }: Props) {
  const [hotline,    setHotline]    = useState(brand.hotline);
  const [agentName,  setAgentName]  = useState(brand.agentName ?? '');
  const [logo,       setLogo]       = useState(brand.logo);
  const [logoCorner, setLogoCorner] = useState<BrandKit['logoCorner']>(brand.logoCorner);
  const fileRef = useRef<HTMLInputElement>(null);

  function readLogo(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setLogo(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function save() {
    dispatch({
      type: 'UPDATE_BRAND',
      patch: { hotline: hotline.trim(), agentName: agentName.trim() || undefined, logo, logoCorner },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{vi.brand.title}</h2>
          <button type="button" onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">
            {vi.brand.hotline} <span className="text-red-400">*</span>
          </span>
          <input type="tel" value={hotline} placeholder="0909 123 456" maxLength={20}
            className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 h-11 text-white text-sm outline-none focus:border-yellow-400"
            onChange={e => setHotline(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-400">{vi.brand.agentName}</span>
          <input type="text" value={agentName} placeholder="Nguyễn Văn A" maxLength={40}
            className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 h-11 text-white text-sm outline-none focus:border-yellow-400"
            onChange={e => setAgentName(e.target.value)} />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400">{vi.brand.logo}</span>
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt="logo" className="w-12 h-12 object-contain bg-neutral-800 rounded border border-neutral-700" />
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="h-11 px-3 bg-neutral-800 border border-neutral-600 rounded-lg text-xs text-neutral-300 hover:border-yellow-400">
              {logo ? 'Đổi logo' : 'Chọn PNG'}
            </button>
            {logo && (
              <button type="button" onClick={() => setLogo(undefined)}
                className="h-11 px-3 text-xs text-red-400 hover:text-red-300">Xoá</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) readLogo(f); }} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400">{vi.brand.logoCorner}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {CORNERS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setLogoCorner(value)}
                className={`h-11 rounded-lg text-xs font-medium transition-colors ${
                  logoCorner === value
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        <button type="button" disabled={!hotline.trim()} onClick={save}
          className="h-11 bg-yellow-400 text-black rounded-xl font-semibold text-sm disabled:opacity-40">
          {vi.brand.save}
        </button>
      </div>
    </div>
  );
}
