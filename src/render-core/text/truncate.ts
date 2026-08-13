import type { UnitMarker } from '../../types/index';
import { FIELD_PRIORITY, MAX_CARD_LINES } from '../../types/index';

type FieldKey = typeof FIELD_PRIORITY[number];

export interface TruncateResult {
  fields: Partial<Record<FieldKey, string>>;
  truncated: boolean;
}

/**
 * Return only the fields to display, dropping from the END of FIELD_PRIORITY
 * until the count fits within MAX_CARD_LINES.
 * Each field counts as ~1 line (Sprint 3 will use actual canvas measurement).
 */
export function truncateFields(data: UnitMarker['data']): TruncateResult {
  const present = FIELD_PRIORITY.filter(k => {
    const v: string | undefined = data[k];
    return v !== undefined && v.trim().length > 0;
  });

  const kept = present.length <= MAX_CARD_LINES ? present : present.slice(0, MAX_CARD_LINES);

  const fields: Partial<Record<FieldKey, string>> = {};
  for (const k of kept) {
    const v: string | undefined = data[k];
    if (v !== undefined) fields[k] = v;
  }

  return { fields, truncated: present.length > MAX_CARD_LINES };
}
