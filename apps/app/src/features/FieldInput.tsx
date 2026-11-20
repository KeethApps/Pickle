import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  addDays, exercisesToText, formatDuration, ingredientsToText, parseExerciseBlock, parseIngredientBlock, toIsoDate,
  formatAmount,
} from '@pickle/core';
import type { ChecklistLine, ExerciseLine, FieldDef, FieldValue, IngredientLine } from '@pickle/core';
import { colors } from '../theme/tokens';
import { Chip, ChipRow } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Input, Stars, Stepper, Toggle } from '../ui/Inputs';
import { Text } from '../ui/Text';

interface Props {
  field: FieldDef;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  /** Values already used for this field elsewhere in the collection (controlled vocabulary). */
  vocabulary?: string[];
  /** Whole-item data, for fields that depend on a sibling (ingredients use "serves"). */
  data?: Record<string, FieldValue>;
  setData?: (fieldId: string, v: FieldValue) => void;
}

export function FieldInput({ field, value, onChange, vocabulary = [], data, setData }: Props) {
  switch (field.type) {
    case 'select':
    case 'multiselect':
      return <PickList field={field} value={value} onChange={onChange} vocabulary={vocabulary} multi={field.type === 'multiselect'} />;
    case 'text':
    case 'url':
      return <Input value={typeof value === 'string' ? value : ''} onChangeText={onChange} placeholder={field.type === 'url' ? 'https://' : field.label} autoCapitalize={field.type === 'url' ? 'none' : 'sentences'} keyboardType={field.type === 'url' ? 'url' : 'default'} />;
    case 'longtext':
      return <Input multiline value={typeof value === 'string' ? value : ''} onChangeText={onChange} placeholder={field.label} />;
    case 'number':
    case 'money':
    case 'progress':
      return (
        <Input
          keyboardType="decimal-pad"
          value={typeof value === 'number' ? String(value) : ''}
          placeholder={field.type === 'money' ? `${field.unit ?? '$'}0` : '0'}
          onChangeText={(t) => { const n = parseFloat(t.replace(',', '.')); onChange(isNaN(n) ? null : n); }}
        />
      );
    case 'duration':
      return <DurationInput field={field} value={value} onChange={onChange} />;
    case 'date':
      return <DateInput value={typeof value === 'string' ? value : ''} onChange={onChange} />;
    case 'toggle':
      return <Toggle on={!!value} onChange={onChange} label={field.label} />;
    case 'counter':
      return <Stepper value={typeof value === 'number' ? value : 0} onChange={onChange} />;
    case 'rating':
      return <Stars value={typeof value === 'number' ? value : 0} onChange={onChange} />;
    case 'checklist':
      return <ChecklistInput value={Array.isArray(value) ? (value as ChecklistLine[]) : []} onChange={onChange} />;
    case 'ingredients':
      return <IngredientsInput value={Array.isArray(value) ? (value as IngredientLine[]) : []} onChange={onChange} serves={typeof data?.serves === 'number' ? (data.serves as number) : 2} setServes={(n) => setData?.('serves', n)} />;
    case 'exercises':
      return <ExercisesInput value={Array.isArray(value) ? (value as ExerciseLine[]) : []} onChange={onChange} />;
    case 'image':
      return <ImageInput value={typeof value === 'string' ? value : ''} onChange={onChange} />;
    default:
      return null;
  }
}

function PickList({ field, value, onChange, vocabulary, multi }: { field: FieldDef; value: FieldValue | undefined; onChange: (v: FieldValue) => void; vocabulary: string[]; multi: boolean }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const selected: string[] = multi ? (Array.isArray(value) ? (value as string[]) : []) : typeof value === 'string' && value ? [value] : [];
  const all = useMemo(() => {
    const set = new Set<string>([...(field.options ?? []), ...vocabulary, ...selected]);
    return [...set];
  }, [field.options, vocabulary, selected.join('|')]);

  const toggle = (v: string) => {
    if (multi) onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
    else onChange(selected.includes(v) ? null : v);
  };
  const addNew = () => {
    const t = draft.trim();
    if (t) toggle(t);
    setDraft('');
    setAdding(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <ChipRow>
        {all.map((o) => <Chip key={o} label={o} on={selected.includes(o)} onPress={() => toggle(o)} />)}
        <Chip label="New" icon="plus" dashed onPress={() => setAdding(true)} />
      </ChipRow>
      {adding ? <Input autoFocus value={draft} onChangeText={setDraft} onSubmitEditing={addNew} onBlur={addNew} placeholder={`New ${field.label.toLowerCase()}`} /> : null}
    </View>
  );
}

function DurationInput({ field, value, onChange }: { field: FieldDef; value: FieldValue | undefined; onChange: (v: FieldValue) => void }) {
  const isSec = field.unit === 'sec';
  const [text, setText] = useState(typeof value === 'number' ? (isSec ? formatDuration(value, 'sec') : String(value)) : '');
  const commit = (t: string) => {
    setText(t);
    if (!t.trim()) return onChange(null);
    if (t.includes(':')) {
      const [m, s] = t.split(':');
      const secs = (parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0);
      return onChange(isSec ? secs : Math.round(secs / 60));
    }
    const n = parseFloat(t);
    if (isNaN(n)) return onChange(null);
    onChange(isSec ? Math.round(n * 60) : n);
  };
  return <Input value={text} onChangeText={commit} keyboardType="numbers-and-punctuation" placeholder={isSec ? 'mm:ss or minutes' : 'minutes'} />;
}

function DateInput({ value, onChange }: { value: string; onChange: (v: FieldValue) => void }) {
  const today = new Date();
  const quick: Array<[string, string]> = [['Today', toIsoDate(today)], ['Tomorrow', toIsoDate(addDays(today, 1))], ['Next week', toIsoDate(addDays(today, 7))], ['In a month', toIsoDate(addDays(today, 30))]];
  return (
    <View style={{ gap: 8 }}>
      <ChipRow>{quick.map(([l, v]) => <Chip key={l} label={l} on={value === v} onPress={() => onChange(v)} />)}</ChipRow>
      <Input value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" autoCapitalize="none" />
    </View>
  );
}

function ChecklistInput({ value, onChange }: { value: ChecklistLine[]; onChange: (v: FieldValue) => void }) {
  const [text, setText] = useState(value.map((l) => l.text).join('\n'));
  const commit = (t: string) => {
    setText(t);
    const lines = t.split('\n').map((x) => x.trim()).filter(Boolean);
    onChange(lines.map((line) => ({ text: line, done: value.find((v) => v.text === line)?.done ?? false })));
  };
  return <Input multiline value={text} onChangeText={commit} placeholder="One step per line" />;
}

function IngredientsInput({ value, onChange, serves, setServes }: { value: IngredientLine[]; onChange: (v: FieldValue) => void; serves: number; setServes: (n: number) => void }) {
  const [text, setText] = useState(ingredientsToText(value));
  const parsed = useMemo(() => parseIngredientBlock(text), [text]);
  const commit = (t: string) => {
    setText(t);
    onChange(parseIngredientBlock(t));
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="label">Serves</Text>
        <Stepper value={serves} onChange={setServes} min={1} />
      </View>
      <Input multiline value={text} onChangeText={commit} placeholder={'Paste a list, one per line.\nUse "Sauce:" for a heading.'} style={{ minHeight: 120 }} />
      {parsed.length ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 12 }}>
          <Text v="meta" style={{ marginBottom: 4 }}>Understood as {parsed.length} lines</Text>
          {parsed.map((l, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ flex: 1 }} color={l.qty === null ? colors.muted : colors.text}>
                <Text bold>{formatAmount(l, serves, serves) || '–'}</Text> {l.name}{l.note ? `, ${l.note}` : ''}
              </Text>
              {l.qty === null ? <Text v="meta" style={{ fontSize: 10 }}>No quantity, not scaled</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ExercisesInput({ value, onChange }: { value: ExerciseLine[]; onChange: (v: FieldValue) => void }) {
  const [text, setText] = useState(exercisesToText(value));
  const commit = (t: string) => {
    setText(t);
    onChange(parseExerciseBlock(t));
  };
  return <Input multiline value={text} onChangeText={commit} placeholder={'Warm-up:\nHip circles 2x10\nMain:\nWall sit 3x40s\nSquat 4x8 @ 20 kg'} style={{ minHeight: 120 }} />;
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: FieldValue) => void }) {
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]) onChange(res.assets[0].uri);
  };
  return (
    <Pressable accessibilityRole="button" onPress={pick} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, minHeight: 48, paddingHorizontal: 14 }}>
      <Icon name="img" size={18} color={colors.muted} />
      <Text style={{ flex: 1 }} color={value ? colors.text : colors.faint}>{value ? 'Image added. Tap to replace' : 'Choose an image (one)'}</Text>
    </Pressable>
  );
}
