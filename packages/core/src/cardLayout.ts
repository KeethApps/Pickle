import type { CollectionDef, ExtraLink, FieldDef, Item, StatusDef } from './types';
import { countdownLabel, formatDuration, formatMoney, isEmptyValue } from './format';
import { formatDay } from './dates';
import { getStatus } from './status';
import { hostLabel } from './urls';

export interface CardView {
  id: string;
  title: string;
  source: string | null;
  tint: string;
  icon: string;
  coverUri: string | null;
  badge: { text: string; warn: boolean } | null;
  subtitle: string[];
  pills: string[];
  line: string | null;
  large: string | null;
  status: StatusDef | null;
  muted: boolean;
  offline: boolean;
  linkDead: boolean;
  primary: { kind: 'maps' | 'link' | 'none'; label: string; url: string | null };
  extraLinks: ExtraLink[];
}

const LIMITS = { sub: 3, pill: 2 };

/** An uploaded image field (Design Inspo) becomes the cover. */
function coverFromFields(collection: CollectionDef, item: Item): string | null {
  const f = collection.fields.find((x) => x.type === 'image');
  const v = f ? item.data[f.id] : null;
  return typeof v === 'string' && v ? v : null;
}

function textOf(field: FieldDef, value: unknown): string | null {
  if (isEmptyValue(value as never)) return null;
  switch (field.type) {
    case 'number': return `${value}${field.unit ? ` ${field.unit}` : ''}`;
    case 'duration': return formatDuration(Number(value), field.unit);
    case 'money': return formatMoney(Number(value), field.unit);
    case 'date': return formatDay(String(value));
    case 'toggle': return value ? field.label : null;
    case 'multiselect': return (value as string[]).join(', ');
    case 'select': case 'text': case 'longtext': return String(value);
    default: return null;
  }
}

/** Pure function: collection schema + item -> everything a card needs to render. */
export function cardLayout(collection: CollectionDef, item: Item, now: Date = new Date()): CardView {
  const status = getStatus(collection, item.statusId);
  const done = status?.kind === 'done';

  const subtitle: string[] = [];
  const pills: string[] = [];
  let line: string | null = null;
  let large: string | null = null;
  let badge: CardView['badge'] = null;

  for (const field of collection.fields) {
    if (field.showWhenDone && !done) continue;
    const value = item.data[field.id];
    if (isEmptyValue(value)) continue;

    switch (field.slot) {
      case 'sub': {
        const t = textOf(field, value);
        if (t && subtitle.length < LIMITS.sub) subtitle.push(t);
        break;
      }
      case 'pill': {
        if (field.type === 'multiselect') {
          for (const v of value as string[]) if (pills.length < LIMITS.pill) pills.push(v);
        } else {
          const t = textOf(field, value);
          if (t && pills.length < LIMITS.pill) pills.push(t);
        }
        break;
      }
      case 'large': {
        if (!large) large = textOf(field, value);
        break;
      }
      case 'line': {
        if (line) break;
        const t = textOf(field, value);
        if (!t) break;
        line = field.showWhenDone ? t : `${field.label}: ${t}`;
        break;
      }
      case 'badge': {
        if (badge) break;
        if (field.type === 'counter') {
          if (Number(value) > 0) badge = { text: `${field.shortLabel ?? field.label} ${value}×`, warn: false };
        } else if (field.type === 'date' && field.format === 'countdown') {
          const c = countdownLabel(String(value), now);
          badge = { text: c.text, warn: c.overdue };
        } else {
          const t = textOf(field, value);
          if (t) badge = { text: t, warn: false };
        }
        break;
      }
      default:
        break;
    }
  }

  // primary action: a maps link, then a store link, then the shared link, then the first extra link
  let primary: CardView['primary'] = { kind: 'none', label: '', url: null };
  const mapsField = collection.fields.find((f) => f.role === 'maps' && typeof item.data[f.id] === 'string' && item.data[f.id]);
  const storeField = collection.fields.find((f) => f.role === 'store' && typeof item.data[f.id] === 'string' && item.data[f.id]);
  if (mapsField) primary = { kind: 'maps', label: 'Open in Maps', url: String(item.data[mapsField.id]) };
  else if (storeField) primary = { kind: 'link', label: collection.actionLabel ?? 'Open link', url: String(item.data[storeField.id]) };
  else if (item.sourceUrl) primary = { kind: 'link', label: collection.actionLabel ?? 'Open link', url: item.sourceUrl };
  else if (item.extraLinks[0]) primary = { kind: 'link', label: item.extraLinks[0].label, url: item.extraLinks[0].url };

  return {
    id: item.id,
    title: item.title?.trim() || 'Untitled',
    source: item.sourceUrl ? hostLabel(item.sourceUrl) : null,
    tint: collection.color,
    icon: collection.icon,
    coverUri: item.coverUri ?? coverFromFields(collection, item),
    badge,
    subtitle,
    pills,
    line,
    large,
    status,
    muted: done,
    offline: !!item.readableText,
    linkDead: item.linkState === 'dead',
    primary,
    extraLinks: item.extraLinks.slice(0, 2),
  };
}
