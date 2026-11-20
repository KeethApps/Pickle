import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { builtinFieldLibrary, cardLayout, DEFAULT_STATUSES } from '@pickle/core';
import type { CardSlot, FieldDef, FieldValue, Item } from '@pickle/core';
import { colors, SWATCHES } from '../../src/theme/tokens';
import { Button, IconButton } from '../../src/ui/Button';
import { Chip, ChipRow, Pill } from '../../src/ui/Chip';
import { Cover } from '../../src/ui/Cover';
import { Icon } from '../../src/ui/Icon';
import { ICONS } from '../../src/ui/icons';
import { Input, Toggle } from '../../src/ui/Inputs';
import { Header, Screen, SectionLabel } from '../../src/ui/Layout';
import { Text } from '../../src/ui/Text';
import { useStore } from '../../src/data/store';

const SLOT_LIMIT: Record<CardSlot, number> = { sub: 3, pill: 2, badge: 1, line: 1, large: 1, detail: 99 };
const SLOT_ORDER: CardSlot[] = ['sub', 'pill', 'badge', 'line', 'large', 'detail'];
const ICON_CHOICES = ['bag', 'book', 'pot', 'fork', 'pin', 'cal', 'dumb', 'tv', 'yt', 'doc', 'flag', 'code', 'img', 'star', 'link'];
const SLOT_LABEL: Record<CardSlot, string> = { sub: 'Subtitle', pill: 'Pill', badge: 'Badge', line: 'Line', large: 'Large', detail: 'Detail' };

function sample(f: FieldDef): FieldValue {
  switch (f.type) {
    case 'select': return f.options?.[0] ?? 'Sample';
    case 'multiselect': return [f.options?.[0] ?? 'Sample'];
    case 'money': return 60;
    case 'number': return 12;
    case 'duration': return f.unit === 'sec' ? 600 : 30;
    case 'date': return new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    case 'toggle': return true;
    case 'counter': return 2;
    case 'progress': return 40;
    case 'rating': return 4;
    default: return f.label;
  }
}

/** Build your own collection by picking fields from the library. The preview renders from the same cardLayout the app uses. */
export default function Builder() {
  const router = useRouter();
  const addCollection = useStore((s) => s.addCollection);
  const library = useMemo(() => builtinFieldLibrary(), []);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('bag');
  const [color, setColor] = useState(SWATCHES[5]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [custom, setCustom] = useState('');

  const used = (slot: CardSlot, except?: string) => fields.filter((f) => f.slot === slot && f.id !== except).length;
  const addField = (f: FieldDef) => {
    if (fields.some((x) => x.id === f.id)) return;
    const slot = SLOT_ORDER.find((s) => s !== 'detail' && used(s) < SLOT_LIMIT[s] && (f.type === 'money' ? s === 'large' : s !== 'large')) ?? 'detail';
    setFields((l) => [...l, { ...f, slot, filter: ['select', 'multiselect', 'number', 'money', 'duration', 'date', 'toggle'].includes(f.type) }]);
  };
  const cycleSlot = (id: string) => {
    setFields((list) => list.map((f) => {
      if (f.id !== id) return f;
      const start = SLOT_ORDER.indexOf(f.slot);
      for (let step = 1; step <= SLOT_ORDER.length; step++) {
        const next = SLOT_ORDER[(start + step) % SLOT_ORDER.length];
        if (next === 'detail' || list.filter((x) => x.slot === next && x.id !== id).length < SLOT_LIMIT[next]) return { ...f, slot: next };
      }
      return f;
    }));
  };
  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    addField({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, type: 'text', slot: 'detail' });
    setCustom('');
  };

  const preview = useMemo(() => {
    const data: Record<string, FieldValue> = {};
    fields.forEach((f) => { data[f.id] = sample(f); });
    const col = { id: 'preview', builtinKey: null, name: name || 'New collection', icon, color, builtIn: false, version: 1, sort: 0, fields, statuses: DEFAULT_STATUSES };
    const item: Item = {
      id: 'p', stage: 'sorted', collectionId: 'preview', statusId: 'open', sourceUrl: 'https://example.com', urlKey: 'example.com', sourceType: 'web',
      title: 'Sample card', caption: null, siteName: null, coverUri: null, readableText: null, linkState: 'ok', note: '', extraLinks: [], data,
      sharedAt: new Date().toISOString(), lastOpenedAt: null, openCount: 0, enrichState: 'done', createdAt: '', updatedAt: '', deletedAt: null,
    };
    return cardLayout(col, item);
  }, [fields, name, icon, color]);

  const create = () => {
    const id = addCollection({ name: name.trim(), icon, color, fields, statuses: DEFAULT_STATUSES });
    router.replace(`/c/${id}`);
  };

  return (
    <Screen>
      <Header title="New collection" onBack={() => router.back()} right={<Button label="Create" disabled={!name.trim()} onPress={create} style={{ minHeight: 44 }} />} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Cover tint={color} icon={icon} width={48} height={48} radius={14} iconSize={22} />
        <View style={{ flex: 1 }}><Input value={name} onChangeText={setName} placeholder="Name, e.g. Gift ideas" /></View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
        {SWATCHES.map((c) => <Pressable key={c} accessibilityLabel={`Color ${c}`} onPress={() => setColor(c)} style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: c }, c === color && { borderWidth: 2, borderColor: colors.text }]} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {ICON_CHOICES.filter((i) => ICONS[i]).map((i) => (
          <Pressable key={i} accessibilityLabel={`Icon ${i}`} onPress={() => setIcon(i)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: i === icon ? colors.surfaceTop : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: i === icon ? 1.5 : 0, borderColor: colors.accent }}>
            <Icon name={i} size={18} color={i === icon ? colors.accent : colors.muted} />
          </Pressable>
        ))}
      </View>

      <SectionLabel>Statuses</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 8 }}>{DEFAULT_STATUSES.map((s) => <Pill key={s.id} label={`${s.label} · ${s.kind}`} />)}</View>
      <Text v="meta" style={{ marginTop: 6 }}>Starts as Open, Active, Done. Rename or add more after creating.</Text>

      <SectionLabel>On this card <Text v="meta" color={colors.faint}>· {fields.length} fields</Text></SectionLabel>
      {fields.map((f) => (
        <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }}>{f.label}</Text>
            <Text v="meta" style={{ fontSize: 11 }}>{f.type}</Text>
          </View>
          <Pressable accessibilityLabel={`Slot for ${f.label}: ${SLOT_LABEL[f.slot]}`} onPress={() => cycleSlot(f.id)}><Pill label={`${SLOT_LABEL[f.slot]} ›`} tone="accent" /></Pressable>
          <View style={{ alignItems: 'center' }}><Text v="meta" style={{ fontSize: 9 }}>Filter</Text><Toggle on={!!f.filter} onChange={(v) => setFields((l) => l.map((x) => (x.id === f.id ? { ...x, filter: v } : x)))} label={`Filter by ${f.label}`} /></View>
          <IconButton icon="x" label={`Remove ${f.label}`} size={32} bg="transparent" color={colors.faint} onPress={() => setFields((l) => l.filter((x) => x.id !== f.id))} />
        </View>
      ))}
      {fields.length === 0 ? <Text v="meta">Pick fields below. Title, link, note and saved date are always there.</Text> : null}

      <SectionLabel>Field library</SectionLabel>
      <ChipRow>
        {library.filter((l) => !fields.some((f) => f.id === l.id)).map((l) => <Chip key={l.libraryId} label={l.label} icon="plus" onPress={() => addField(l)} />)}
      </ChipRow>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <View style={{ flex: 1 }}><Input value={custom} onChangeText={setCustom} placeholder="New text field" onSubmitEditing={addCustom} /></View>
        <Button label="Add" variant="ghost" onPress={addCustom} disabled={!custom.trim()} />
      </View>

      <SectionLabel>Card preview</SectionLabel>
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 18, padding: 10, gap: 12, alignItems: 'center' }}>
        <Cover tint={color} icon={icon} width={56} height={56} radius={14} iconSize={22} />
        <View style={{ flex: 1 }}>
          <Text bold style={{ fontSize: 14 }}>{preview.title}</Text>
          {preview.subtitle.length ? <Text v="meta">{preview.subtitle.join(' · ')}</Text> : null}
          {preview.large ? <Text bold style={{ fontSize: 16 }}>{preview.large}</Text> : null}
          {preview.line ? <Text v="meta" color={colors.accent}>{preview.line}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>{preview.pills.map((p) => <Pill key={p} label={p} />)}</View>
        </View>
        {preview.badge ? <Pill label={preview.badge.text} tone="accent" /> : null}
      </View>
    </Screen>
  );
}
