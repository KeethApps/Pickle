import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { StatusDef, StatusKind } from '@pickle/core';
import { colors, STATUS_COLORS } from '../../../src/theme/tokens';
import { Button, IconButton } from '../../../src/ui/Button';
import { Icon } from '../../../src/ui/Icon';
import { Input } from '../../../src/ui/Inputs';
import { Header, Screen, SectionLabel, Segmented } from '../../../src/ui/Layout';
import { Text } from '../../../src/ui/Text';
import { StatusDot } from '../../../src/features/StatusChip';
import { useCollection } from '../../../src/data/hooks';
import { useStore } from '../../../src/data/store';

const KINDS: Array<{ value: StatusKind; label: string }> = [{ value: 'open', label: 'Open' }, { value: 'active', label: 'Active' }, { value: 'done', label: 'Done' }];

/** Rename, recolor, reorder, add and remove statuses. Behavior follows the type, never the name. */
export default function StatusEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const collection = useCollection(id);
  const saveCollection = useStore((s) => s.saveCollection);
  const items = useStore((s) => s.items);
  const [selected, setSelected] = useState<string | null>(null);
  if (!collection) return null;

  const statuses = collection.statuses;
  const sel = statuses.find((s) => s.id === selected) ?? null;
  const save = (list: StatusDef[]) => saveCollection({ ...collection, statuses: list });
  const patch = (sid: string, p: Partial<StatusDef>) => save(statuses.map((s) => (s.id === sid ? { ...s, ...p } : s)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= statuses.length) return;
    const copy = [...statuses];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    save(copy);
  };
  const add = () => {
    const sid = `s_${Date.now().toString(36)}`;
    save([...statuses, { id: sid, label: 'New status', color: STATUS_COLORS[3], kind: 'open' }]);
    setSelected(sid);
  };
  const inUse = (sid: string) => items.filter((i) => !i.deletedAt && i.collectionId === collection.id && i.statusId === sid).length;
  const remove = (sid: string) => {
    if (statuses.length <= 1 || inUse(sid) > 0) return;
    save(statuses.filter((s) => s.id !== sid));
    setSelected(null);
  };

  return (
    <Screen>
      <Header title="Statuses" subtitle={collection.name} onBack={() => router.back()} right={<IconButton icon="plus" label="Add status" onPress={add} />} />
      {statuses.map((s, i) => (
        <Pressable key={s.id} accessibilityRole="button" onPress={() => setSelected(s.id)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, minHeight: 54, marginBottom: 8 }, s.id === selected && { borderWidth: 2, borderColor: colors.accent }]}>
          <View style={{ gap: 2 }}>
            <Pressable accessibilityLabel="Move up" onPress={() => move(i, -1)} hitSlop={8}><Icon name="up" size={14} color={colors.faint} /></Pressable>
            <Pressable accessibilityLabel="Move down" onPress={() => move(i, 1)} hitSlop={8} style={{ transform: [{ rotate: '180deg' }] }}><Icon name="up" size={14} color={colors.faint} /></Pressable>
          </View>
          <StatusDot status={s} size={14} />
          <Text style={{ flex: 1, fontFamily: 'Poppins_500Medium' }}>{s.label}</Text>
          <Text v="meta">{s.kind}</Text>
        </Pressable>
      ))}

      {sel ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginTop: 6 }}>
          <SectionLabel style={{ marginTop: 0 }}>Name</SectionLabel>
          <Input value={sel.label} onChangeText={(t) => patch(sel.id, { label: t })} />
          <SectionLabel>Color</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {STATUS_COLORS.map((c) => (
              <Pressable key={c} accessibilityLabel={`Color ${c}`} onPress={() => patch(sel.id, { color: c })} style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: c }, sel.color === c && { borderWidth: 2, borderColor: colors.text }]} />
            ))}
          </View>
          <SectionLabel>Type</SectionLabel>
          <Segmented value={sel.kind} onChange={(k) => patch(sel.id, { kind: k })} options={KINDS} />
          <Button label={inUse(sel.id) > 0 ? `${inUse(sel.id)} cards use this status` : 'Delete status'} variant="ghost" disabled={statuses.length <= 1 || inUse(sel.id) > 0} onPress={() => remove(sel.id)} style={{ marginTop: 16 }} />
        </View>
      ) : null}

      <Text v="meta" style={{ marginTop: 16, lineHeight: 20 }}>
        Open counts as still to do and can come back in Rediscover. Active is in progress and stays highlighted. Done is muted and left out of Rediscover and Tidy up.
      </Text>
    </Screen>
  );
}
