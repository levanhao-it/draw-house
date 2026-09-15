import { useEffect, useRef } from 'react';
import { vi } from '../../i18n/vi';
import { MAX_FIELD_LEN } from '../../types/index';

interface Props {
  /** Screen coordinates of the click (clientX/clientY). */
  x: number;
  y: number;
  placeholder?: string;
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

export default function QuickInputPopover({ x, y, placeholder, onSubmit, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submitOrCancel = () => {
    const code = inputRef.current?.value.trim() ?? '';
    if (code) onSubmit(code);
    else onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitOrCancel();
    } else if (e.key === 'Escape') {
      // Explicit discard. iPad's on-screen keyboard has no Escape key — touch users get
      // the ✕ button below instead.
      onCancel();
    }
  };

  // Clamp inside the viewport: a tap near the right/bottom edge (common on a tablet-width
  // screen) must not render the popover partly off-screen, right where the iPad on-screen
  // keyboard is about to slide up from.
  const left = Math.min(x + 12, window.innerWidth - 240);
  const top  = Math.min(Math.max(y - 24, 8), window.innerHeight - 90);

  return (
    <div
      className="fixed z-50 bg-neutral-900 border border-yellow-400/50 rounded-xl shadow-2xl p-3 flex items-center gap-2"
      style={{ left, top }}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={MAX_FIELD_LEN}
        placeholder={placeholder ?? vi.step2.quickInput}
        onKeyDown={handleKeyDown}
        // Blur now keeps a typed value (submits) instead of always discarding it — a stray
        // tap elsewhere to dismiss the iPad keyboard must not silently delete the marker.
        onBlur={submitOrCancel}
        className="
          bg-transparent border-none outline-none text-white text-base w-48
          placeholder:text-neutral-500
        "
      />
      {/* Visible confirm/cancel: touch has no Escape key. onPointerDown+preventDefault keeps
          focus on the input so it never blurs (and submits/cancels) before the click lands. */}
      <button
        type="button"
        onPointerDown={e => e.preventDefault()}
        onClick={onCancel}
        title="Huỷ"
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 touch-manipulation"
      >✕</button>
      <button
        type="button"
        onPointerDown={e => e.preventDefault()}
        onClick={submitOrCancel}
        title="Xong"
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-black bg-yellow-400 hover:bg-yellow-300 font-semibold touch-manipulation"
      >✓</button>
    </div>
  );
}
