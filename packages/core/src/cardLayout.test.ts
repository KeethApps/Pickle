import { describe, it, expect } from 'vitest';
import { BUILTIN_COLLECTIONS, getBuiltin } from './builtins';
import { cardLayout } from './cardLayout';
import type { Item } from './types';

const base: Item = {
  id: 'i1', stage: 'sorted', collectionId: 'recipes', statusId: 'to-make',
  sourceUrl: 'https://instagram.com/reel/x', urlKey: 'instagram.com/reel/x', sourceType: 'instagram',
  title: 'Baked feta pasta', caption: null, siteName: null, coverUri: null, readableText: null,
  linkState: 'ok', note: '', extraLinks: [], data: {},
  sharedAt: '2026-11-01T00:00:00Z', lastOpenedAt: null, openCount: 0, enrichState: 'done',
  createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z', deletedAt: null,
};

describe('builtins', () => {
  it('has 13 collections with unique ids and valid slot limits', () => {
    expect(BUILTIN_COLLECTIONS.length).toBe(13);
    expect(new Set(BUILTIN_COLLECTIONS.map((c) => c.id)).size).toBe(13);
    for (const c of BUILTIN_COLLECTIONS) {
      expect(c.fields.filter((f) => f.slot === 'sub').length).toBeLessThanOrEqual(3);
      expect(c.fields.filter((f) => f.slot === 'badge').length).toBeLessThanOrEqual(2);
      expect(c.statuses.length).toBeGreaterThan(0);
      expect(new Set(c.fields.map((f) => f.id)).size).toBe(c.fields.length);
    }
  });
});

describe('cardLayout', () => {
  const recipes = getBuiltin('recipes')!;
  it('puts fields in their slots', () => {
    const v = cardLayout(recipes, { ...base, data: { cuisine: 'Italian', time: 30, meal: 'Dinner', diet: ['Veg', 'High protein'], made: 2 } });
    expect(v.subtitle).toEqual(['Italian', '30 min']);
    expect(v.pills).toEqual(['Dinner', 'Veg']);
    expect(v.badge?.text).toBe('Made 2×');
    expect(v.primary.label).toBe('Open recipe');
    expect(v.muted).toBe(false);
  });
  it('mutes done cards', () => {
    expect(cardLayout(recipes, { ...base, statusId: 'made' }).muted).toBe(true);
  });
  it('prefers a maps link', () => {
    const r = getBuiltin('restaurants')!;
    const v = cardLayout(r, { ...base, collectionId: 'restaurants', statusId: 'to-try', data: { map_link: 'https://maps.app.goo.gl/x', dish: 'cacio e pepe' } });
    expect(v.primary.kind).toBe('maps');
    expect(v.line).toBe('Dish to try: cacio e pepe');
  });
  it('works with no link at all', () => {
    const v = cardLayout(recipes, { ...base, sourceUrl: null, urlKey: null, sourceType: 'manual' });
    expect(v.primary.kind).toBe('none');
    expect(v.source).toBeNull();
  });
  it('shows a countdown badge for deadlines and flags overdue', () => {
    const o = getBuiltin('opportunities')!;
    const now = new Date(2026, 10, 20);
    const soon = cardLayout(o, { ...base, collectionId: 'opportunities', statusId: 'applying', data: { deadline: '2026-12-01' } }, now);
    expect(soon.badge).toEqual({ text: '11 days', warn: false });
    const late = cardLayout(o, { ...base, collectionId: 'opportunities', statusId: 'applying', data: { deadline: '2026-11-19' } }, now);
    expect(late.badge?.warn).toBe(true);
  });
  it('hides key takeaway until the article is read', () => {
    const a = getBuiltin('articles')!;
    const it1 = { ...base, collectionId: 'articles', statusId: 'unread', data: { takeaway: 'Salt early' } };
    expect(cardLayout(a, it1).line).toBeNull();
    expect(cardLayout(a, { ...it1, statusId: 'read' }).line).toBe('Salt early');
  });
});
