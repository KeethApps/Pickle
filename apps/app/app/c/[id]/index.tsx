import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { applyQuery, describeFilter, facetCounts, hasRangeFilter, rangePresets } from '@pickle/core';
import type { Filter, SortKey } from '@pickle/core';
import { colors } from '../../../src/theme/tokens';
import { IconButton, Button } from '../../../src/ui/Button';
import { Chip, ChipRow } from '../../../src/ui/Chip';
import { Icon } from '../../../src/ui/Icon';
import { Input } from '../../../src/ui/Inputs';
import { Header, Screen, Segmented, useIsWide } from '../../../src/ui/Layout';
import { Text } from '../../../src/ui/Text';
import { ItemCard } from '../../../src/features/ItemCard';
import { useCollection, useSorted } from '../../../src/data/hooks';
import { openMany } from '../../../src/data/links';
import { resolveLink, useStore } from '../../../src/data/store';
import { useQueryStore } from '../../../src/data/queryStore';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const wide = useIsWide();
  const collection = useCollection(id);
  const sorted = useSorted();
  const queries = useQueryStore((s) => s.queries);
  const q = useQueryStore();
  const markOpened = useStore((s) => s.markOpened);
  const deleteMany = useStore((s) => s.deleteMany);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [popupNote, setPopupNote] = useState<string | null>(null);

  const query = collection ? (queries[collection.id] ?? q.get(collection)) : null;
  const items = useMemo(() => (collection && query ? applyQuery(sorted, collection, query) : []), [sorted, collection, query]);
  if (!collection || !query) return null;

  const total = sorted.filter((i) => i.collectionId === collection.id).length;
  const filterFields = collection.fields.filter((f) => f.filter);
  const cols = wide ? 4 : 2;
  const hasDate = collection.fields.some((f) => f.type === 'date' && (f.slot === 'badge' || f.filter));
  const sortOptions: Array<{ value: SortKey; label: string }> = [{ value: 'newest', label: 'Newest' }, ...(hasDate ? [{ value: 'soonest' as SortKey, label: 'Soonest' }] : []), { value: 'title', label: 'A to Z' }];
  const nextSort = () => { const i = sortOptions.findIndex((o) => o.value === query.sort); q.setSort(collection, sortOptions[(i + 1) % sortOptions.length].value); };

  const toggle = (itemId: string) => { setSelecting(true); setPicked((p) => (p.includes(itemId) ? p.filter((x) => x !== itemId) : [...p, itemId])); };
  const openSelected = () => {
    const urls = picked.map((pid) => {
      const it = sorted.find((x) => x.id === pid);
      return it ? resolveLink(it, collection, 'core') : null;
    }).filter(Boolean) as string[];
    const opened = openMany(urls);
    picked.forEach(markOpened);
    setPopupNote(opened < urls.length ? `Your browser opened ${opened} of ${urls.length}. Allow pop-ups for this site to open them all.` : null);
  };

  const rows: string[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols).map((x) => x.id));

  const header = (
    <Header
      title={collection.name}
      subtitle={`${total} saved${items.length !== total ? ` · ${items.length} shown` : ''}`}
      onBack={wide ? undefined : () => router.back()}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {wide ? <IconButton icon={selecting ? 'x' : 'check'} label={selecting ? 'Cancel selecting' : 'Select'} onPress={() => { setSelecting((s) => !s); setPicked([]); }} /> : null}
          <IconButton icon="clock" label={`Sort: ${sortOptions.find((o) => o.value === query.sort)?.label}`} onPress={nextSort} />
          {!wide ? (
            <View>
              <IconButton icon="filter" label="Filters" onPress={() => router.push(`/c/${collection.id}/filters`)} />
              {query.filters.length ? <View style={styles.dot}><Text bold color={colors.accentInk} style={{ fontSize: 10, lineHeight: 14 }}>{query.filters.length}</Text></View> : null}
            </View>
          ) : null}
          <IconButton icon="set" label="Edit statuses" onPress={() => router.push(`/c/${collection.id}/statuses`)} />
        </View>
      }
    />
  );

  const main = (
    <>
      {header}
      <Input leftIcon="search" value={query.text} onChangeText={(t) => q.setText(collection, t)} placeholder={`Search ${collection.name.toLowerCase()}`} />
      {query.filters.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
          {query.filters.map((f: Filter, i: number) => {
            const field = collection.fields.find((x) => x.id === f.fieldId)!;
            return <Chip key={i} on label={describeFilter(field, f)} trailingIcon="x" onPress={() => q.removeFilter(collection, i)} />;
          })}
          <Pressable accessibilityRole="button" onPress={() => q.clear(collection)} style={{ justifyContent: 'center', paddingHorizontal: 6 }}><Text v="meta">Clear</Text></Pressable>
        </ScrollView>
      ) : null}
      <View style={{ marginTop: 14 }}>
        <Segmented value={query.statusScope} onChange={(v) => q.setScope(collection, v)} options={[{ value: 'all', label: 'All' }, { value: 'notDone', label: 'Not done' }, { value: 'done', label: 'Done' }]} />
      </View>
      <View style={{ marginTop: 14, gap: 10 }}>
        {rows.map((r, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
            {r.map((rid) => {
              const it = items.find((x) => x.id === rid)!;
              return <ItemCard key={rid} item={it} collection={collection} selectMode={selecting} selected={picked.includes(rid)} onToggleSelect={() => toggle(rid)} onPress={() => router.push(`/item/${rid}`)} coverHeight={wide ? 130 : 112} />;
            })}
            {r.length < cols ? Array.from({ length: cols - r.length }).map((_, k) => <View key={`s${k}`} style={{ flex: 1 }} />) : null}
          </View>
        ))}
        {items.length === 0 ? <Text color={colors.muted} style={{ marginTop: 20, textAlign: 'center' }}>{total === 0 ? 'Nothing here yet. Tap + to add a card.' : 'No cards match these filters.'}</Text> : null}
      </View>
    </>
  );

  const fab = (
    <Pressable accessibilityRole="button" accessibilityLabel={`Add card to ${collection.name}`} onPress={() => router.push(`/new/${collection.id}`)} style={styles.fab}>
      <Icon name="plus" size={22} color={colors.accentInk} strokeWidth={2.2} />
    </Pressable>
  );

  if (!wide) return <View style={{ flex: 1 }}><Screen bottomInset={80}>{main}</Screen>{fab}</View>;

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <ScrollView style={styles.facets} contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text v="heading" style={{ flex: 1 }}>Filters</Text>
          <Pressable onPress={() => q.clear(collection)}><Text v="meta">Clear</Text></Pressable>
        </View>
        {filterFields.map((f) => {
          const inFilter = (query.filters.find((x) => x.fieldId === f.id && x.op === 'in')?.value as string[] | undefined) ?? [];
          return (
            <View key={f.id}>
              <Text v="caps" style={{ marginTop: 18, marginBottom: 8 }}>{f.label}</Text>
              {f.type === 'select' || f.type === 'multiselect' ? (
                facetCounts(sorted, collection, f).map((fc) => (
                  <Pressable key={fc.value} accessibilityRole="checkbox" onPress={() => q.toggleIn(collection, f.id, fc.value)} style={styles.facet}>
                    <View style={[styles.box, inFilter.includes(fc.value) && { backgroundColor: colors.accent, borderColor: colors.accent }]}>{inFilter.includes(fc.value) ? <Icon name="check" size={11} color={colors.accentInk} strokeWidth={3} /> : null}</View>
                    <Text style={{ flex: 1, fontSize: 13 }}>{fc.value}</Text>
                    <Text v="meta">{fc.count}</Text>
                  </Pressable>
                ))
              ) : f.type === 'toggle' ? (
                <ChipRow>
                  {([['Yes', true], ['No', false]] as const).map(([l, v]) => <Chip key={l} label={l} on={query.filters.some((x) => x.fieldId === f.id && x.value === v)} onPress={() => q.setBool(collection, f.id, query.filters.some((x) => x.fieldId === f.id && x.value === v) ? null : v)} />)}
                </ChipRow>
              ) : hasRangeFilter(f) ? (
                <ChipRow>
                  {rangePresets(f).map((p) => <Chip key={p.label} label={p.label} on={query.filters.some((x) => x.fieldId === f.id && x.op === p.filter.op && x.value === p.filter.value)} onPress={() => q.setRange(collection, f.id, p.filter)} />)}
                </ChipRow>
              ) : f.type === 'counter' ? (
                <ChipRow>
                  <Chip label="Made / done" on={query.filters.some((x) => x.fieldId === f.id && x.op === 'gte')} onPress={() => q.setRange(collection, f.id, { op: 'gte', value: 1 })} />
                  <Chip label="Not yet" on={query.filters.some((x) => x.fieldId === f.id && x.op === 'lte')} onPress={() => q.setRange(collection, f.id, { op: 'lte', value: 0 })} />
                </ChipRow>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      <View style={{ flex: 1 }}>
        <Screen bottomInset={90}>{main}</Screen>
        {fab}
        {selecting && picked.length ? (
          <View style={styles.selectBar}>
            <View>
              <Text bold>{picked.length} selected</Text>
              <Text v="meta">Click to select</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Button label={`Open ${picked.length} link${picked.length === 1 ? '' : 's'}`} icon="ext" style={{ minHeight: 44 }} onPress={openSelected} />
              <Button label="Delete" icon="trash" variant="danger" style={{ minHeight: 44 }} onPress={() => { deleteMany(picked); setPicked([]); setSelecting(false); }} />
            </View>
          </View>
        ) : null}
        {popupNote ? <View style={styles.note}><Text style={{ fontSize: 12 }}>{popupNote}</Text></View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  facets: { width: 240, borderRightWidth: 1, borderRightColor: '#2A2A2A', flexGrow: 0 },
  facet: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  box: { width: 16, height: 16, borderRadius: 5, borderWidth: 1.5, borderColor: '#6E7066', alignItems: 'center', justifyContent: 'center' },
  selectBar: { position: 'absolute', alignSelf: 'center', bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceTop, borderRadius: 20, paddingVertical: 10, paddingLeft: 20, paddingRight: 10 },
  note: { position: 'absolute', left: 24, right: 100, bottom: 90, backgroundColor: colors.surfaceHi, borderRadius: 12, padding: 12 },
});
