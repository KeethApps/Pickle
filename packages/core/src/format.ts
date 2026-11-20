import type { FieldDef, FieldValue, IngredientLine, ExerciseLine } from './types';
import { daysUntil, formatDay } from './dates';

export function isEmptyValue(v: FieldValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'boolean') return false;
  return false;
}

/** 90 -> "1 h 30 min", 30 -> "30 min". With unit 'sec': 860 -> "14:20". */
export function formatDuration(value: number, unit: string | undefined): string {
  if (unit === 'sec') {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  if (value >= 60) {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  return `${value} min`;
}

export function formatMoney(value: number, symbol: string | undefined): string {
  const s = symbol ?? '$';
  const rounded = Math.round(value * 100) / 100;
  return `${s}${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
}

export function countdownLabel(iso: string, now: Date = new Date()): { text: string; overdue: boolean; days: number } {
  const d = daysUntil(iso, now);
  if (d < 0) return { text: d === -1 ? 'Overdue 1 day' : `Overdue ${-d} days`, overdue: true, days: d };
  if (d === 0) return { text: 'Today', overdue: false, days: d };
  if (d === 1) return { text: 'Tomorrow', overdue: false, days: d };
  return { text: `${d} days`, overdue: false, days: d };
}

/** Plain text for a field value, or null when there is nothing to show. */
export function formatFieldValue(field: FieldDef, value: FieldValue | undefined, now: Date = new Date()): string | null {
  if (isEmptyValue(value)) return null;
  switch (field.type) {
    case 'text': case 'longtext': case 'select': case 'url':
      return String(value);
    case 'multiselect':
      return (value as string[]).join(', ');
    case 'number':
      return `${value}${field.unit ? ` ${field.unit}` : ''}`;
    case 'money':
      return formatMoney(Number(value), field.unit);
    case 'duration':
      return formatDuration(Number(value), field.unit);
    case 'date':
      return field.format === 'countdown' ? countdownLabel(String(value), now).text : formatDay(String(value));
    case 'rating':
      return `${value} / 5`;
    case 'toggle':
      return value ? 'Yes' : 'No';
    case 'counter':
      return Number(value) > 0 ? `${field.shortLabel ?? field.label} ${value}×` : null;
    case 'progress':
      return `${value}%`;
    case 'checklist': {
      const list = value as Array<{ done: boolean }>;
      return `${list.filter((x) => x.done).length} of ${list.length}`;
    }
    case 'ingredients':
      return `${(value as IngredientLine[]).length} ingredients`;
    case 'exercises':
      return `${(value as ExerciseLine[]).length} exercises`;
    case 'image':
      return 'Image';
    default:
      return null;
  }
}
