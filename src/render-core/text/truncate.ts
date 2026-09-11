import type { UnitMarker } from '../../types/index';
import { FIELD_PRIORITY, MAX_CARD_LINES } from '../../types/index';

type FieldKey = typeof FIELD_PRIORITY[number];

export interface TruncateResult {
  fields: Partial<Record<FieldKey, string>>;
  truncated: boolean;
}

// Mirrors drawUnitCard's layout: T2 fields pack two-per-line, T3 (price/hook) share one line.
const T2_KEYS = ['area', 'rooms', 'orient', 'view', 'loan', 'capital'] as const;
const T3_KEYS = ['price', 'hook'] as const;

function countLines(present: ReadonlySet<FieldKey>): number {
  const t2Count = T2_KEYS.filter(k => present.has(k)).length;
  const t3Count = T3_KEYS.some(k => present.has(k)) ? 1 : 0;
  return 1 /* T1 code, always shown */ + Math.ceil(t2Count / 2) + t3Count;
}

/**
 * Return only the fields to display, dropping the lowest-priority field
 * (from the END of FIELD_PRIORITY) until the actual rendered line count
 * — code + paired T2 rows + one T3 row — fits within MAX_CARD_LINES.
 */
export function truncateFields(data: UnitMarker['data']): TruncateResult {
  const present = new Set<FieldKey>(
    FIELD_PRIORITY.filter(k => {
      if (k === 'code') return false;
      const v = data[k];
      return v !== undefined && v.trim().length > 0;
    }),
  );

  const dropOrder = [...FIELD_PRIORITY].reverse(); // lowest priority first
  let truncated = false;
  while (countLines(present) > MAX_CARD_LINES) {
    const next = dropOrder.find(k => present.has(k));
    if (!next) break;
    present.delete(next);
    truncated = true;
  }

  const fields: Partial<Record<FieldKey, string>> = { code: data.code };
  for (const k of FIELD_PRIORITY) {
    if (!present.has(k)) continue;
    const v = data[k];
    if (v !== undefined) fields[k] = v;
  }

  return { fields, truncated };
}
