import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { applyQuery, facetCounts, hasRangeFilter, rangePresets } from '@pickle/core';
import { Button } from '../../../src/ui/Button';
import { Chip, ChipRow } from '../../../src/ui/Chip';
import { SectionLabel, Segmented } from '../../../src/ui/Layout';
import { Sheet } from '../../../src/ui/Sheet';
import { Text } from '../../../src/ui/Text';
import { useCollection, useSorted } from '../../../src/data/hooks';
import { useQueryStore } from '../../../src/data/queryStore';

/** Filter sheet, generated from the fields marked filter: true. Only values in use are shown, with counts. */
export default function FiltersSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const collection = useCollection(id);
  const sorted = useSorted();
  const q = useQueryStore();
  const queries = useQueryStore((s) => s.queries);
  if (!collection) return null;
  const query = queries[collection.id] ?? q.get(collection);
  const count = applyQuery(sorted, collection, query).length;
  const fields = collection.fields.filter((f) => f.filter);

  return (
    <Sheet
      title="Filters"
      subtitle={collection.name}
      footer={<Button label={`Show ${count} ${count === 1 ? 'card' : 'cards'}`} onPress={() => router.back()} />}
    >
      <Text onPress={() => q.clear(collection)} v="meta" style={{ alignSelf: 'flex-end', paddingVertical: 6 }}>Clear all</Text>
      {fields.map((f) => {
        const inFilter = (query.filters.find((x) => x.fieldId === f.id && x.op === 'in')?.value as string[] | undefined) ?? [];
        return (
          <View key={f.id}>
            <SectionLabel>{f.label}</SectionLabel>
            {f.type === 'select' || f.type === 'multiselect' ? (
              <ChipRow>{facetCounts(sorted, collection, f).map((fc) => <Chip key={fc.value} label={fc.value} count={fc.count} on={inFilter.includes(fc.value)} onPress={() => q.toggleIn(collection, f.id, fc.value)} />)}</ChipRow>
            ) : f.type === 'toggle' ? (
              <Segmented
                value={query.filters.find((x) => x.fieldId === f.id)?.value === true ? 'yes' : query.filters.find((x) => x.fieldId === f.id)?.value === false ? 'no' : 'any'}
                onChange={(v) => q.setBool(collection, f.id, v === 'any' ? null : v === 'yes')}
                options={[{ value: 'any', label: 'Any' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
              />
            ) : f.type === 'counter' ? (
              <Segmented
                value={query.filters.some((x) => x.fieldId === f.id && x.op === 'gte') ? 'yes' : query.filters.some((x) => x.fieldId === f.id && x.op === 'lte') ? 'no' : 'any'}
                onChange={(v) => q.setRange(collection, f.id, v === 'any' ? null : v === 'yes' ? { op: 'gte', value: 1 } : { op: 'lte', value: 0 })}
                options={[{ value: 'any', label: 'Any' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not yet' }]}
              />
            ) : hasRangeFilter(f) ? (
              <ChipRow>
                {rangePresets(f).map((p) => <Chip key={p.label} label={p.label} on={query.filters.some((x) => x.fieldId === f.id && x.op === p.filter.op && x.value === p.filter.value)} onPress={() => q.setRange(collection, f.id, p.filter)} />)}
              </ChipRow>
            ) : null}
          </View>
        );
      })}
      <SectionLabel>Status</SectionLabel>
      <Segmented value={query.statusScope} onChange={(v) => q.setScope(collection, v)} options={[{ value: 'all', label: 'All' }, { value: 'notDone', label: 'Not done' }, { value: 'done', label: 'Done' }]} />
    </Sheet>
  );
}
