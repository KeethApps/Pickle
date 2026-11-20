import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDays, formatDay, toIsoDate } from '@pickle/core';
import { colors } from '../../../src/theme/tokens';
import { Button } from '../../../src/ui/Button';
import { Chip, ChipRow } from '../../../src/ui/Chip';
import { Input, Toggle } from '../../../src/ui/Inputs';
import { Row, Segmented, SectionLabel } from '../../../src/ui/Layout';
import { Sheet } from '../../../src/ui/Sheet';
import { Text } from '../../../src/ui/Text';
import { useCollection, useItem } from '../../../src/data/hooks';
import { useStore } from '../../../src/data/store';
import { extractDeadline } from '@pickle/core';

type Due = 'none' | 'today' | 'tomorrow' | 'weekend' | 'week' | 'pick';

function dueDate(due: Due, picked: string, time: string): string | null {
  const now = new Date();
  let d: Date | null = null;
  if (due === 'today') d = now;
  else if (due === 'tomorrow') d = addDays(now, 1);
  else if (due === 'weekend') d = addDays(now, (6 - now.getDay() + 7) % 7 || 7);
  else if (due === 'week') d = addDays(now, 7);
  else if (due === 'pick' && /^\d{4}-\d{2}-\d{2}$/.test(picked)) { const [y, m, dd] = picked.split('-').map(Number); d = new Date(y, m - 1, dd); }
  if (!d) return null;
  const [h, mi] = time.split(':').map((x) => parseInt(x, 10) || 0);
  d.setHours(h, mi, 0, 0);
  return d.toISOString();
}

/** Add a reminder or a task to any card. A task may have no date. */
export default function RemindSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useItem(id);
  const collection = useCollection(item?.collectionId ?? undefined);
  const addReminder = useStore((s) => s.addReminder);
  const defaultTime = useStore((s) => s.settings.defaultReminderTime);

  const [kind, setKind] = useState<'reminder' | 'task'>('reminder');
  const [label, setLabel] = useState('');
  const [due, setDue] = useState<Due>('weekend');
  const [picked, setPicked] = useState('');
  const [time, setTime] = useState(defaultTime);
  const [openLink, setOpenLink] = useState(true);
  const [marks, setMarks] = useState(false);
  const [laptop, setLaptop] = useState(false);
  if (!item) return null;

  const suggestion = item.caption ? extractDeadline(item.caption) : (typeof item.data.deadline === 'string' ? item.data.deadline : null);
  const doneStatus = collection?.statuses.find((s) => s.kind === 'done') ?? null;
  const text = label.trim() || (kind === 'reminder' ? `Check out: ${item.title ?? 'this'}` : '');
  const fireAt = kind === 'task' && due === 'none' ? null : dueDate(due === 'none' ? 'tomorrow' : due, picked, time);
  const canSave = kind === 'reminder' ? !!fireAt : text.length > 0;

  const save = () => {
    addReminder({
      itemId: item.id, kind, label: text, fireAt, openLink: openLink && !!item.sourceUrl, linkTarget: 'core',
      completeMarksItem: kind === 'task' && marks, completeStatusId: marks ? doneStatus?.id ?? null : null,
      notifyPhone: true, notifyLaptop: laptop,
    });
    router.back();
  };

  const dueOptions: Array<[Due, string]> = kind === 'task'
    ? [['none', 'No date'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['pick', 'Pick date']]
    : [['tomorrow', 'Tomorrow'], ['weekend', 'This weekend'], ['week', 'Next week'], ['pick', 'Pick date']];

  return (
    <Sheet title="Add to Reminders" subtitle={item.title ?? undefined} footer={<Button label={kind === 'task' ? 'Add task' : 'Set reminder'} onPress={save} disabled={!canSave} />}>
      <Segmented value={kind} onChange={(k) => { setKind(k); setDue(k === 'task' ? 'none' : 'weekend'); }} options={[{ value: 'reminder', label: 'Reminder' }, { value: 'task', label: 'Task' }]} />
      {suggestion ? (
        <Row style={{ backgroundColor: colors.accentSoft, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Text color={colors.accent} style={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }}>Deadline found: {formatDay(suggestion)}</Text>
            <Text v="meta">Remind me the day before</Text>
          </View>
          <Button label="Use" style={{ minHeight: 40, paddingHorizontal: 16 }} onPress={() => { setDue('pick'); setPicked(toIsoDate(addDays(new Date(suggestion), -1))); setTime(defaultTime); }} />
        </Row>
      ) : null}
      <SectionLabel>{kind === 'task' ? 'What needs doing' : 'Label'}</SectionLabel>
      <Input value={label} onChangeText={setLabel} placeholder={kind === 'task' ? 'e.g. Book a table for Saturday' : `Check out: ${item.title ?? ''}`} />
      <SectionLabel>{kind === 'task' ? 'Due' : 'When'}</SectionLabel>
      <ChipRow>{dueOptions.map(([v, l]) => <Chip key={v} label={l} on={due === v} onPress={() => setDue(v)} />)}</ChipRow>
      {due === 'pick' ? <View style={{ marginTop: 10 }}><Input value={picked} onChangeText={setPicked} placeholder="YYYY-MM-DD" autoCapitalize="none" /></View> : null}
      {due !== 'none' ? <View style={{ marginTop: 10 }}><Input value={time} onChangeText={setTime} placeholder="09:00" keyboardType="numbers-and-punctuation" leftIcon="clock" /></View> : null}
      <View style={{ marginTop: 18 }}>
        {item.sourceUrl ? <Row><View style={{ flex: 1 }}><Text>Open the link when due</Text></View><Toggle on={openLink} onChange={setOpenLink} label="Open link when due" /></Row> : null}
        {kind === 'task' && doneStatus ? <Row><View style={{ flex: 1 }}><Text>Mark card {doneStatus.label} when done</Text></View><Toggle on={marks} onChange={setMarks} label="Mark card done when completed" /></Row> : null}
        <Row><View style={{ flex: 1 }}><Text>Also notify my laptop</Text></View><Toggle on={laptop} onChange={setLaptop} label="Notify laptop" /></Row>
      </View>
      {kind === 'reminder' ? (
        <View style={{ backgroundColor: colors.surfaceHi, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Text bold color={colors.accentInk}>P</Text></View>
          <View style={{ flex: 1 }}>
            <Text v="meta" style={{ fontSize: 11 }}>Pickle · {time}</Text>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }} numberOfLines={1}>{text}</Text>
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}
