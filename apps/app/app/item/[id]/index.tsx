import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cardLayout, countdownLabel, formatAmount, formatDay, formatFieldValue, formatMoney, formatSetsReps, formatTime,
  hostLabel, ingredientGroups, isEmptyValue,
} from '@pickle/core';
import type { ChecklistLine, ExerciseLine, FieldDef, IngredientLine } from '@pickle/core';
import { colors } from '../../../src/theme/tokens';
import { Button, IconButton } from '../../../src/ui/Button';
import { Cover } from '../../../src/ui/Cover';
import { Icon } from '../../../src/ui/Icon';
import { Input, Stepper } from '../../../src/ui/Inputs';
import { Pill } from '../../../src/ui/Chip';
import { SectionLabel, useIsWide } from '../../../src/ui/Layout';
import { Text } from '../../../src/ui/Text';
import { CheckRow, KV, KVGrid, LinkRow } from '../../../src/features/DetailBlocks';
import { StatusChip } from '../../../src/features/StatusChip';
import { useCollection, useItem } from '../../../src/data/hooks';
import { openUrl } from '../../../src/data/links';
import { resolveLink, useStore } from '../../../src/data/store';

/** One screen for every collection: it renders from the schema. */
export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const item = useItem(id);
  const collection = useCollection(item?.collectionId ?? undefined);
  const store = useStore.getState;
  const reminders = useStore((s) => s.reminders);
  const setStatus = useStore((s) => s.setStatus);
  const setData = useStore((s) => s.setData);
  const patchItem = useStore((s) => s.patchItem);
  const markOpened = useStore((s) => s.markOpened);
  const runQuickAction = useStore((s) => s.runQuickAction);
  const addExtraLink = useStore((s) => s.addExtraLink);
  const removeExtraLink = useStore((s) => s.removeExtraLink);
  const toggleReminder = useStore((s) => s.toggleReminder);
  const deleteItem = useStore((s) => s.deleteItem);

  const baseServings = typeof item?.data.serves === 'number' ? (item.data.serves as number) : 2;
  const [servings, setServings] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const myReminders = useMemo(() => reminders.filter((r) => r.itemId === id).sort((a, b) => (a.doneAt ? 1 : 0) - (b.doneAt ? 1 : 0)), [reminders, id]);

  if (!item || !collection) return null;
  const view = cardLayout(collection, item);
  const status = view.status ?? collection.statuses[0];
  const done = status.kind === 'done';
  const current = servings ?? baseServings;
  const qa = collection.quickAction;
  const qaDone = !!qa?.statusId && item.statusId === qa.statusId;
  const open = (url: string | null) => { markOpened(item.id); openUrl(url); };

  const kvFields: FieldDef[] = [];
  const blocks: React.ReactNode[] = [];
  let hero: React.ReactNode = null;
  let large: React.ReactNode = null;

  for (const f of collection.fields) {
    const v = item.data[f.id];
    if (f.role) continue; // link fields render in the Links section
    if (f.showWhenDone && !done) {
      blocks.push(<View key={f.id}><SectionLabel>{f.label}</SectionLabel><Text v="meta" color={colors.faint}>Appears here once you mark it {status.label.toLowerCase()}</Text></View>);
      continue;
    }
    if (f.type === 'image' || f.id === 'serves' && collection.fields.some((x) => x.type === 'ingredients')) continue;
    if (isEmptyValue(v)) continue;

    if (f.type === 'date' && f.format === 'countdown') {
      const c = countdownLabel(String(v));
      hero = (
        <View style={[styles.hero, { backgroundColor: c.overdue ? colors.danger : colors.accent }]}>
          <Text style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1 }} bold color={colors.accentInk}>{c.days >= 0 ? c.days : -c.days}</Text>
          <View style={{ flex: 1 }}>
            <Text bold color={colors.accentInk} style={{ fontSize: 15 }}>{c.overdue ? 'days overdue' : c.days === 0 ? 'due today' : 'days left'}</Text>
            <Text color={colors.accentInk} style={{ fontSize: 12, opacity: 0.75 }}>{f.label} {formatDay(String(v))}</Text>
          </View>
        </View>
      );
      continue;
    }
    if (f.id === 'date' && collection.id === 'events') {
      const c = countdownLabel(String(v));
      hero = (
        <View style={[styles.hero, { backgroundColor: collection.color }]}>
          <Text style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1 }} bold color={colors.accentInk}>{Math.abs(c.days)}</Text>
          <View style={{ flex: 1 }}>
            <Text bold color={colors.accentInk} style={{ fontSize: 15 }}>{c.days < 0 ? 'days ago' : 'days to go'}</Text>
            <Text color={colors.accentInk} style={{ fontSize: 12, opacity: 0.75 }}>{formatDay(String(v))}</Text>
          </View>
        </View>
      );
      continue;
    }
    if (f.type === 'money' && f.slot === 'large') { large = <Text bold style={{ fontSize: 34, letterSpacing: -0.5, marginTop: 6 }}>{formatMoney(Number(v), f.unit)}</Text>; continue; }

    if (f.type === 'ingredients') {
      const lines = v as IngredientLine[];
      blocks.push(
        <View key={f.id}>
          <SectionLabel>Ingredients <Text v="meta" color={colors.faint}>· {lines.filter((l) => l.done).length} of {lines.length}</Text></SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Stepper value={current} min={1} onChange={setServings} />
            <Text style={{ fontFamily: 'Poppins_500Medium' }}>servings</Text>
            <View style={{ flex: 1 }} />
            {current !== baseServings ? <Text v="meta">Scaled from {baseServings}</Text> : null}
          </View>
          {ingredientGroups(lines).map((g, gi) => (
            <View key={gi}>
              {g.group ? <Text v="meta" bold style={{ marginTop: 12, marginBottom: 2 }}>{g.group}</Text> : null}
              {g.lines.map(({ line, index }) => (
                <CheckRow
                  key={index}
                  done={!!line.done}
                  onPress={() => setData(item.id, f.id, lines.map((l, i) => (i === index ? { ...l, done: !l.done } : l)))}
                  text={[formatAmount(line, baseServings, current), line.name + (line.note ? `, ${line.note}` : '')].filter(Boolean).join(' ')}
                />
              ))}
            </View>
          ))}
        </View>,
      );
      continue;
    }
    if (f.type === 'exercises') {
      const lines = v as ExerciseLine[];
      let last: string | undefined = '__none__';
      blocks.push(
        <View key={f.id}>
          <SectionLabel>Exercises <Text v="meta" color={colors.faint}>· sets × reps</Text></SectionLabel>
          {lines.map((e, i) => {
            const head = e.group !== last ? <Text v="meta" bold style={{ marginTop: i ? 12 : 0, marginBottom: 6 }}>{e.group ?? 'Exercises'}</Text> : null;
            last = e.group;
            return (
              <View key={i}>
                {head}
                <Pressable accessibilityRole="checkbox" onPress={() => setData(item.id, f.id, lines.map((l, j) => (j === i ? { ...l, done: !l.done } : l)))} style={styles.exRow}>
                  <View style={[styles.box, e.done && { backgroundColor: colors.accent, borderColor: colors.accent }]}>{e.done ? <Icon name="check" size={12} color={colors.accentInk} strokeWidth={3} /> : null}</View>
                  <Text style={{ flex: 1, fontFamily: 'Poppins_500Medium', textDecorationLine: e.done ? 'line-through' : 'none' }} color={e.done ? colors.faint : colors.text}>{e.name}</Text>
                  {e.weight ? <Pill label={e.weight} /> : null}
                  <Text bold style={{ minWidth: 54, textAlign: 'right' }}>{formatSetsReps(e)}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>,
      );
      continue;
    }
    if (f.type === 'checklist') {
      const lines = v as ChecklistLine[];
      blocks.push(
        <View key={f.id}>
          <SectionLabel>{f.label} <Text v="meta" color={colors.faint}>· {lines.filter((l) => l.done).length} of {lines.length}</Text></SectionLabel>
          {lines.map((l, i) => <CheckRow key={i} text={l.text} done={l.done} onPress={() => setData(item.id, f.id, lines.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />)}
        </View>,
      );
      continue;
    }
    kvFields.push(f);
  }

  const kv = kvFields.map((f) => {
    const t = formatFieldValue(f, item.data[f.id]);
    if (!t) return null;
    return <KV key={f.id} label={f.label} value={t} wide={f.type === 'longtext'} />;
  });

  const linkFields = collection.fields.filter((f) => f.role && typeof item.data[f.id] === 'string' && item.data[f.id]);
  const addLink = () => {
    if (!linkUrl.trim()) return;
    addExtraLink(item.id, { label: linkLabel.trim() || hostLabel(linkUrl), url: /^https?:\/\//.test(linkUrl) ? linkUrl.trim() : `https://${linkUrl.trim()}` });
    setLinkLabel(''); setLinkUrl('');
  };

  const primaryLabel = view.primary.kind === 'maps' ? 'Open in Maps' : view.primary.label || 'Open link';
  const canOpen = view.primary.kind !== 'none';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: wide ? 720 : undefined }}>
          <Cover tint={collection.color} icon={collection.icon} uri={view.coverUri} height={wide ? 180 : 150} iconSize={48}>
            <View style={[styles.heroBtns, { top: Math.max(insets.top, 12) + 8 }]}>
              <IconButton icon="back" label="Back" bg="rgba(26,26,24,0.7)" onPress={() => router.back()} />
              <View style={{ flex: 1 }} />
              <IconButton icon="bell" label="Remind or add task" bg="rgba(26,26,24,0.7)" onPress={() => router.push(`/item/${item.id}/remind`)} />
              <IconButton icon="more" label="More" bg="rgba(26,26,24,0.7)" onPress={() => setMenu(true)} />
            </View>
          </Cover>
          <View style={styles.sheet}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pill label={collection.name} tone="accent" />
              <StatusChip collection={collection} statusId={item.statusId} onChange={(s) => setStatus(item.id, s)} />
              <View style={{ flex: 1 }} />
              <Text v="meta" numberOfLines={1}>{item.sourceUrl ? hostLabel(item.sourceUrl) : 'Added by hand'}</Text>
            </View>
            <Text v="title" style={{ fontSize: 22, lineHeight: 28, marginTop: 8 }}>{item.title}</Text>
            {large}
            {view.line ? <Text color={colors.accent} style={{ marginTop: 8, fontFamily: 'Poppins_500Medium', fontSize: 13 }}>{view.line}</Text> : null}
            {hero}
            {kv.some(Boolean) ? <View style={{ marginTop: 14 }}><KVGrid>{kv}</KVGrid></View> : null}
            {blocks}

            <SectionLabel>Links</SectionLabel>
            {item.sourceUrl ? <LinkRow title={view.source ?? 'Original'} sub="Original post" onPress={() => open(item.sourceUrl)} /> : null}
            {linkFields.map((f) => <LinkRow key={f.id} title={f.label} sub={hostLabel(String(item.data[f.id]))} onPress={() => open(String(item.data[f.id]))} />)}
            {item.extraLinks.map((l) => <LinkRow key={l.id} title={l.label} sub={hostLabel(l.url)} onPress={() => open(l.url)} onRemove={() => removeExtraLink(item.id, l.id)} />)}
            <View style={{ gap: 8, marginTop: 4 }}>
              <Input value={linkLabel} onChangeText={setLinkLabel} placeholder="Label, e.g. Menu, Amazon" />
              <Input leftIcon="link" value={linkUrl} onChangeText={setLinkUrl} placeholder="https://" autoCapitalize="none" keyboardType="url" onSubmitEditing={addLink} />
              <Button label="Add link" icon="plus" variant="ghost" disabled={!linkUrl.trim()} onPress={addLink} />
            </View>

            {myReminders.length ? (
              <>
                <SectionLabel>Reminders and tasks</SectionLabel>
                {myReminders.map((r) => (
                  <CheckRow
                    key={r.id}
                    done={!!r.doneAt}
                    onPress={() => toggleReminder(r.id)}
                    text={`${r.label}${r.fireAt ? ` · ${formatDay(r.fireAt)}, ${formatTime(r.fireAt)}` : ' · anytime'}`}
                  />
                ))}
              </>
            ) : null}

            <SectionLabel>Note</SectionLabel>
            <Input multiline defaultValue={item.note} onEndEditing={(e) => patchItem(item.id, { note: e.nativeEvent.text })} onChangeText={(t) => patchItem(item.id, { note: t })} placeholder="Add a note" />
            <Text v="meta" style={{ marginTop: 16 }}>Saved {formatDay(item.sharedAt)} · opened {item.openCount} time{item.openCount === 1 ? '' : 's'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={{ flexDirection: 'row', gap: 10, width: '100%', maxWidth: 720 }}>
          {canOpen ? <Button label={primaryLabel} icon={view.primary.kind === 'maps' ? 'pin' : 'ext'} style={{ flex: 1 }} onPress={() => open(view.primary.url)} /> : <Button label="Edit" icon="edit" style={{ flex: 1 }} onPress={() => router.push(`/item/${item.id}/edit`)} />}
          {qa ? <Button label={qaDone ? `${qa.label} ✓` : qa.label} variant="ghost" icon="check" onPress={() => runQuickAction(item.id)} /> : null}
        </View>
      </View>

      <Modal transparent visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.scrim} onPress={() => setMenu(false)}>
          <View style={styles.menu}>
            <Pressable style={styles.menuItem} onPress={() => { setMenu(false); router.push(`/item/${item.id}/edit`); }}><Icon name="edit" size={18} /><Text>Edit</Text></Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setMenu(false); router.push(`/item/${item.id}/remind`); }}><Icon name="bell" size={18} /><Text>Remind or add task</Text></Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setMenu(false); deleteItem(item.id); router.back(); }}><Icon name="trash" size={18} color={colors.dangerText} /><Text color={colors.dangerText}>Delete</Text></Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBtns: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', gap: 8 },
  sheet: { marginTop: -22, backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 14, marginTop: 14 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  box: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6E7066', alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.chrome, borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 14, paddingHorizontal: 20, alignItems: 'center' },
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  menu: { width: '100%', maxWidth: 320, backgroundColor: colors.chrome, borderRadius: 24, padding: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 14 },
});
