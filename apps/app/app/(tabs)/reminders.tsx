import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { daysUntil, formatDay, formatTime } from '@pickle/core';
import type { Reminder } from '@pickle/core';
import { colors } from '../../src/theme/tokens';
import { Chip } from '../../src/ui/Chip';
import { Icon } from '../../src/ui/Icon';
import { Header, Screen } from '../../src/ui/Layout';
import { Text } from '../../src/ui/Text';
import { openUrl } from '../../src/data/links';
import { resolveLink, useStore } from '../../src/data/store';

type Tab = 'today' | 'upcoming' | 'anytime' | 'done';

function ReminderRow({ r }: { r: Reminder }) {
  const router = useRouter();
  const items = useStore((s) => s.items);
  const collections = useStore((s) => s.collections);
  const toggle = useStore((s) => s.toggleReminder);
  const markOpened = useStore((s) => s.markOpened);
  const item = items.find((i) => i.id === r.itemId);
  const collection = collections.find((c) => c.id === item?.collectionId);
  const overdue = !!r.fireAt && !r.doneAt && new Date(r.fireAt).getTime() < Date.now() && daysUntil(r.fireAt) < 0;
  const link = item && r.openLink ? resolveLink(item, collection, r.linkTarget) : null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8 }}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!r.doneAt }} accessibilityLabel={`Complete ${r.label}`} onPress={() => toggle(r.id)}
        style={{ width: 22, height: 22, borderRadius: r.kind === 'task' ? 7 : 11, borderWidth: 2, borderColor: overdue ? colors.danger : '#6E7066', backgroundColor: r.doneAt ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {r.doneAt ? <Icon name="check" size={12} color={colors.accentInk} strokeWidth={3} /> : null}
      </Pressable>
      <Pressable style={{ flex: 1 }} accessibilityRole="button" onPress={() => item && router.push(`/item/${item.id}`)}>
        <Text numberOfLines={2} style={{ fontFamily: 'Poppins_500Medium', textDecorationLine: r.doneAt ? 'line-through' : 'none' }} color={r.doneAt ? colors.faint : colors.text}>{r.label}</Text>
        <Text v="meta"><Text v="meta" color={overdue ? colors.dangerText : colors.muted}>{r.fireAt ? `${formatDay(r.fireAt)}, ${formatTime(r.fireAt)}` : 'No date'}</Text> · {item?.title ?? 'Card'} · {r.kind === 'task' ? 'Task' : 'Reminder'}</Text>
      </Pressable>
      {link ? <Pressable accessibilityLabel="Open link" onPress={() => { if (item) markOpened(item.id); openUrl(link); }} hitSlop={10}><Icon name="ext" size={18} color={colors.faint} /></Pressable> : null}
    </View>
  );
}

export default function RemindersScreen() {
  const reminders = useStore((s) => s.reminders);
  const [tab, setTab] = useState<Tab>('today');

  const groups = useMemo(() => {
    const open = reminders.filter((r) => !r.doneAt);
    const byDate = (a: Reminder, b: Reminder) => (a.fireAt ?? '9') < (b.fireAt ?? '9') ? -1 : 1;
    return {
      overdue: open.filter((r) => r.fireAt && daysUntil(r.fireAt) < 0).sort(byDate),
      today: open.filter((r) => r.fireAt && daysUntil(r.fireAt) === 0).sort(byDate),
      upcoming: open.filter((r) => r.fireAt && daysUntil(r.fireAt) > 0).sort(byDate),
      anytime: open.filter((r) => !r.fireAt),
      done: reminders.filter((r) => r.doneAt),
    };
  }, [reminders]);

  const Section = ({ title, list, danger }: { title: string; list: Reminder[]; danger?: boolean }) =>
    list.length ? (
      <View>
        <Text v="caps" color={danger ? colors.dangerText : colors.muted} style={{ marginTop: 16, marginBottom: 8 }}>{title}</Text>
        {list.map((r) => <ReminderRow key={r.id} r={r} />)}
      </View>
    ) : null;

  const tabs: Array<[Tab, string, number]> = [
    ['today', 'Today', groups.overdue.length + groups.today.length],
    ['upcoming', 'Upcoming', groups.upcoming.length],
    ['anytime', 'Anytime', groups.anytime.length],
    ['done', 'Done', 0],
  ];

  return (
    <Screen>
      <Header title="Reminders" subtitle="Reminders and tasks from any card" />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map(([t, l, n]) => <Chip key={t} label={l} count={n || undefined} on={tab === t} onPress={() => setTab(t)} />)}
      </View>
      {tab === 'today' ? <><Section title="Overdue" list={groups.overdue} danger /><Section title="Today" list={groups.today} />{groups.overdue.length + groups.today.length === 0 ? <Text color={colors.muted} style={{ marginTop: 24, textAlign: 'center' }}>Nothing due today.</Text> : null}</> : null}
      {tab === 'upcoming' ? <><Section title="Upcoming" list={groups.upcoming} />{groups.upcoming.length === 0 ? <Text color={colors.muted} style={{ marginTop: 24, textAlign: 'center' }}>Nothing coming up.</Text> : null}</> : null}
      {tab === 'anytime' ? <><Section title="Anytime" list={groups.anytime} />{groups.anytime.length === 0 ? <Text color={colors.muted} style={{ marginTop: 24, textAlign: 'center' }}>No dateless tasks.</Text> : null}</> : null}
      {tab === 'done' ? <><Section title="Done" list={groups.done} />{groups.done.length === 0 ? <Text color={colors.muted} style={{ marginTop: 24, textAlign: 'center' }}>Nothing completed yet.</Text> : null}</> : null}
      <Text v="meta" style={{ textAlign: 'center', marginTop: 16 }}>Square = task, round = reminder. Tap to complete.</Text>
    </Screen>
  );
}
