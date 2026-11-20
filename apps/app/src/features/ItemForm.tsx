import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { isEmptyValue, normalizeUrl } from '@pickle/core';
import type { CollectionDef, ExtraLink, FieldDef, FieldValue, Item } from '@pickle/core';
import { colors } from '../theme/tokens';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Inputs';
import { SectionLabel } from '../ui/Layout';
import { Text } from '../ui/Text';
import { useSorted } from '../data/hooks';
import type { ItemInput } from '../data/store';
import { FieldInput } from './FieldInput';
import { StatusChip } from './StatusChip';

interface Props {
  collection: CollectionDef;
  initial?: Item;
  mode: 'new' | 'edit' | 'sort';
  submitLabel: string;
  onSubmit: (input: ItemInput) => string | void;
  initialTitle?: string;
  initialData?: Record<string, FieldValue>;
}

/** Primary fields are the ones you filter by, plus the card's main content. Everything else sits under "More details". */
export function splitFields(collection: CollectionDef): { primary: FieldDef[]; more: FieldDef[] } {
  const hasIngredients = collection.fields.some((f) => f.type === 'ingredients');
  const list = collection.fields.filter((f) => !(hasIngredients && f.id === 'serves'));
  const primary = list.filter((f) => f.filter || ['ingredients', 'exercises', 'image'].includes(f.type));
  const more = list.filter((f) => !primary.includes(f));
  return { primary, more };
}

export function ItemForm({ collection, initial, mode, submitLabel, onSubmit, initialTitle, initialData }: Props) {
  const sorted = useSorted();
  const [title, setTitle] = useState(initial?.title ?? initialTitle ?? '');
  const [link, setLink] = useState('');
  const [statusId, setStatusId] = useState<string>(initial?.statusId ?? collection.statuses[0].id);
  const [data, setData] = useState<Record<string, FieldValue>>({ ...(initialData ?? {}), ...(initial?.data ?? {}) });
  const [extra, setExtra] = useState<ExtraLink[]>(initial?.extraLinks ?? []);
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const { primary, more } = useMemo(() => splitFields(collection), [collection]);
  const [showMore, setShowMore] = useState(mode === 'edit' || primary.length === 0);

  const vocab = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of collection.fields) {
      if (f.type !== 'select' && f.type !== 'multiselect') continue;
      const set = new Set<string>();
      for (const it of sorted) {
        if (it.collectionId !== collection.id) continue;
        const v = it.data[f.id];
        if (typeof v === 'string' && v) set.add(v);
        if (Array.isArray(v)) (v as unknown[]).forEach((x) => typeof x === 'string' && set.add(x));
      }
      map[f.id] = [...set];
    }
    return map;
  }, [sorted, collection]);

  const setField = (id: string, v: FieldValue) => setData((d) => ({ ...d, [id]: v }));
  const canSave = title.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    if (mode === 'new' && link.trim() && !normalizeUrl(link)) return setError('That link does not look right.');
    const cleaned: Record<string, FieldValue> = {};
    for (const [k, v] of Object.entries(data)) if (!isEmptyValue(v) || typeof v === 'boolean') cleaned[k] = v;
    const result = onSubmit({ title: title.trim(), link: mode === 'new' ? link.trim() : undefined, statusId, data: cleaned, extraLinks: extra, note });
    if (typeof result === 'string') setError(result);
  };

  const renderField = (f: FieldDef) => (
    <View key={f.id}>
      {f.type !== 'ingredients' ? <SectionLabel>{f.label}</SectionLabel> : <SectionLabel>Ingredients</SectionLabel>}
      <FieldInput field={f} value={data[f.id]} onChange={(v) => setField(f.id, v)} vocabulary={vocab[f.id]} data={data} setData={setField} />
    </View>
  );

  return (
    <View>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text v="meta" style={{ marginBottom: 6 }}>
            {['restaurants', 'places'].includes(collection.builtinKey ?? collection.id) ? 'Name' : 'Title'}
          </Text>
          <Input value={title} onChangeText={setTitle} placeholder="Required" autoFocus={mode === 'new'} />
        </View>
        <View style={{ paddingTop: 22 }}>
          <StatusChip collection={collection} statusId={statusId} onChange={setStatusId} />
        </View>
      </View>

      {mode === 'new' ? (
        <View style={{ marginTop: 12 }}>
          <Text v="meta" style={{ marginBottom: 6 }}>Link <Text v="meta" color={colors.faint}>· optional</Text></Text>
          <Input leftIcon="link" value={link} onChangeText={setLink} placeholder="Paste a link" autoCapitalize="none" keyboardType="url" />
        </View>
      ) : initial?.sourceUrl ? (
        <Text v="meta" style={{ marginTop: 8 }} numberOfLines={1}>{initial.sourceUrl}</Text>
      ) : null}

      {primary.map(renderField)}

      {more.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setShowMore((s) => !s)} style={styles.more}>
          <Icon name={showMore ? 'minus' : 'plus'} size={18} color={colors.muted} />
          <Text style={{ flex: 1 }}>More details</Text>
          <Text v="meta">{more.map((f) => f.label).slice(0, 3).join(', ')}</Text>
          <Icon name="chev" size={16} color={colors.faint} />
        </Pressable>
      ) : null}
      {showMore ? more.map(renderField) : null}

      {showMore || mode === 'edit' ? (
        <>
          <SectionLabel>Extra links</SectionLabel>
          <ExtraLinksEditor links={extra} onChange={setExtra} />
          <SectionLabel>Note</SectionLabel>
          <Input multiline value={note} onChangeText={setNote} placeholder="Add a note" />
        </>
      ) : null}

      {error ? <Text color={colors.dangerText} style={{ marginTop: 14 }}>{error}</Text> : null}
      <View style={{ marginTop: 24 }}>
        <Button label={submitLabel} onPress={submit} disabled={!canSave} />
      </View>
    </View>
  );
}

export function ExtraLinksEditor({ links, onChange }: { links: ExtraLink[]; onChange: (l: ExtraLink[]) => void }) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const add = () => {
    const n = normalizeUrl(url);
    if (!n) return;
    onChange([...links, { id: `x_${Date.now().toString(36)}`, label: label.trim() || n.host, url: n.url }]);
    setLabel('');
    setUrl('');
  };
  return (
    <View style={{ gap: 8 }}>
      {links.map((l) => (
        <View key={l.id} style={styles.linkRow}>
          <Icon name="link" size={16} color={colors.muted} />
          <View style={{ flex: 1 }}>
            <Text v="label" numberOfLines={1}>{l.label}</Text>
            <Text v="meta" numberOfLines={1}>{l.url}</Text>
          </View>
          <Pressable accessibilityLabel={`Remove ${l.label}`} onPress={() => onChange(links.filter((x) => x.id !== l.id))}><Icon name="x" size={16} color={colors.faint} /></Pressable>
        </View>
      ))}
      <Input value={label} onChangeText={setLabel} placeholder="Label, e.g. Amazon, Menu, Tickets" />
      <Input leftIcon="link" value={url} onChangeText={setUrl} placeholder="https://" autoCapitalize="none" keyboardType="url" onSubmitEditing={add} />
      <Button label="Add link" variant="ghost" icon="plus" onPress={add} disabled={!url.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, minHeight: 52, marginTop: 20 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
});
