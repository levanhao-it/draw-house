import { useEffect, useRef } from 'react';
import { vi } from '../../i18n/vi';
import { MAX_FIELD_LEN } from '../../types/index';

interface Props {
  /** Screen coordinates of the click (clientX/clientY). */
  x: number;
  y: number;
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

export default function QuickInputPopover({ x, y, onSubmit, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = inputRef.current?.value.trim() ?? '';
      if (code) onSubmit(code);
      else onCancel();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="fixed z-50 bg-neutral-900 border border-yellow-400/50 rounded-xl shadow-2xl p-3"
      style={{ left: x + 12, top: y - 24 }}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={MAX_FIELD_LEN}
        placeholder={vi.step2.quickInput}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        className="
          bg-transparent border-none outline-none text-white text-sm w-48
          placeholder:text-neutral-500
        "
      />
    </div>
  );
}
