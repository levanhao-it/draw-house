/**
 * Reformats a raw price string for display: adds thousand separators to a bare
 * numeric value and normalises a trailing "vnd"/"vnđ" unit to "đ".
 * Anything that isn't a plain number (+ optional currency suffix) — e.g.
 * "3.25 tỷ", "Thoả thuận" — is returned unchanged so user-authored text is
 * never mangled.
 */
export function formatPriceDisplay(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d[\d.,]*\d|\d)\s*(vn[dđ]|[dđ])?$/i);
  if (!match) return trimmed;

  const digits = match[1]!.replace(/[.,]/g, '');
  if (digits.length < 4) return trimmed;

  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withSeparators} đ`;
}
