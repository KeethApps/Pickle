import { describe, it, expect } from 'vitest';
import { getBuiltin } from './builtins';
import { applyQuery, emptyQuery, facetCounts, rangePresets } from './filters';
import type { Item } from './types';

const mk = (id: string, title: string, data: Item['data'], statusId = 'to-make', sharedAt = '2026-11-01T00:00:00Z'): Item => ({
  id, stage: 'sorted', collectionId: 'recipes', statusId, sourceUrl: null, urlKey: null, sourceType: 'manual',
  title, caption: null, siteName: null, coverUri: null, readableText: null, linkState: 'unknown', note: '',
  extraLinks: [], data, sharedAt, lastOpenedAt: null, openCount: 0, enrichState: 'skipped',
  createdAt: sharedAt, updatedAt: sharedAt, deletedAt: null,
});

const recipes = getBuiltin('recipes')!;
const items = [
  mk('1', 'Baked feta pasta', { cuisine: 'Italian', time: 30 }),
  mk('2', 'Cacio e pepe', { cuisine: 'Italian', time: 15 }, 'made', '2026-11-05T00:00:00Z'),
  mk('3', 'Gochujang bowl', { cuisine: 'Korean', time: 30, diet: ['Veg'] }),
  mk('4', 'Slow ragu', { cuisine: 'Italian', time: 180 }),
];

describe('applyQuery', () => {
  it('filters Italian and 30 minutes or less', () => {
    const q = { ...emptyQuery(recipes), filters: [
      { fieldId: 'cuisine', op: 'in' as const, value: ['Italian'] },
      { fieldId: 'time', op: 'lte' as const, value: 30 },
    ] };
    expect(applyQuery(items, recipes, q).map((i) => i.id).sort()).toEqual(['1', '2']);
  });
  it('searches text', () => {
    expect(applyQuery(items, recipes, { ...emptyQuery(recipes), text: 'gochu' }).map((i) => i.id)).toEqual(['3']);
  });
  it('scopes by status kind', () => {
    const notDone = applyQuery(items, recipes, { ...emptyQuery(recipes), statusScope: 'notDone' });
    expect(notDone.map((i) => i.id)).not.toContain('2');
  });
  it('ignores deleted and inbox items', () => {
    const list = [...items, { ...mk('5', 'Gone', {}), deletedAt: '2026-11-10T00:00:00Z' }, { ...mk('6', 'Inbox', {}), stage: 'inbox' as const }];
    expect(applyQuery(list, recipes, emptyQuery(recipes)).length).toBe(4);
  });
  it('sorts newest first by default for collections without a date field', () => {
    expect(applyQuery(items, recipes, emptyQuery(recipes))[0].id).toBe('2');
  });
});

describe('facets and presets', () => {
  it('counts values in use', () => {
    const cuisine = recipes.fields.find((f) => f.id === 'cuisine')!;
    expect(facetCounts(items, recipes, cuisine)).toEqual([{ value: 'Italian', count: 3 }, { value: 'Korean', count: 1 }]);
  });
  it('offers sensible range presets', () => {
    const time = recipes.fields.find((f) => f.id === 'time')!;
    expect(rangePresets(time).map((p) => p.label)).toEqual(['≤ 15', '≤ 30', '≤ 45']);
  });
});

import { toCsv } from './backup';
describe('toCsv', () => {
  it('writes a header and quotes commas', () => {
    const csv = toCsv(recipes, [mk('1', 'Pasta, baked', { cuisine: 'Italian', time: 30 })]);
    const lines = csv.split('\n');
    expect(lines[0].startsWith('title,source_url,status,saved_on,note,extra_links,Cuisine')).toBe(true);
    expect(lines[1].startsWith('"Pasta, baked",,To make,2026-11-01')).toBe(true);
   
  });
});
