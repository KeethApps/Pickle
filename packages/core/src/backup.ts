import type { CollectionDef, FieldValue, Item } from './types';
import { formatFieldValue } from './format';
import { getStatus } from './status';

function cell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function valueText(field: CollectionDef['fields'][number], v: FieldValue | undefined): string {
  if (v === undefined || v === null) return '';
  if (field.type === 'ingredients' || field.type === 'exercises' || field.type === 'checklist') {
    return JSON.stringify(v);
  }
  return formatFieldValue(field, v) ?? '';
}

/** One CSV per collection: title, link, status, saved date, note, extra links, then every field. */
export function toCsv(collection: CollectionDef, items: Item[]): string {
  const head = ['title', 'source_url', 'status', 'saved_on', 'note', 'extra_links', ...collection.fields.map((f) => f.label)];
  const rows = items
    .filter((i) => i.collectionId === collection.id && !i.deletedAt)
    .map((i) => [
      i.title ?? '',
      i.sourceUrl ?? '',
      getStatus(collection, i.statusId)?.label ?? '',
      i.sharedAt.slice(0, 10),
      i.note,
      i.extraLinks.map((l) => `${l.label}: ${l.url}`).join(' | '),
      ...collection.fields.map((f) => valueText(f, i.data[f.id])),
    ]);
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\n');
}
