import React, { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { toCsv } from '@pickle/core';
import { colors } from '../../src/theme/tokens';
import { Button } from '../../src/ui/Button';
import { Chip, ChipRow } from '../../src/ui/Chip';
import { Input } from '../../src/ui/Inputs';
import { Header, Screen, SectionLabel } from '../../src/ui/Layout';
import { Text } from '../../src/ui/Text';
import { ItemRow } from '../../src/features/ItemRow';
import { useCollections } from '../../src/data/hooks';
import { useStore } from '../../src/data/store';

async function deliver(filename: string, text: string, mime: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ message: text, title: filename });
  }
}

export default function Backup() {
  const router = useRouter();
  const collections = useCollections();
  const items = useStore((s) => s.items);
  const exportJson = useStore((s) => s.exportJson);
  const importJson = useStore((s) => s.importJson);
  const restoreItem = useStore((s) => s.restoreItem);
  const emptyTrash = useStore((s) => s.emptyTrash);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const trash = items.filter((i) => i.deletedAt);

  return (
    <Screen>
      <Header title="Backup and trash" onBack={() => router.back()} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Export JSON" icon="dl" style={{ flex: 1 }} onPress={() => deliver(`pickle-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJson(), 'application/json')} />
      </View>
      <Text v="meta" style={{ marginTop: 8 }}>Includes every collection, item and reminder. Cover images are not included.</Text>

      <SectionLabel>Import JSON</SectionLabel>
      <Input multiline value={paste} onChangeText={setPaste} placeholder="Paste a Pickle backup here" />
      <Button label="Import" variant="ghost" disabled={!paste.trim()} style={{ marginTop: 10 }} onPress={() => { const r = importJson(paste); setMsg(r.message); if (r.ok) setPaste(''); }} />
      {msg ? <Text v="meta" color={colors.accent} style={{ marginTop: 8 }}>{msg}</Text> : null}

      <SectionLabel>CSV per collection</SectionLabel>
      <ChipRow>{collections.map((c) => <Chip key={c.id} label={c.name} icon="dl" onPress={() => deliver(`${c.id}.csv`, toCsv(c, items), 'text/csv')} />)}</ChipRow>

      <SectionLabel>Trash</SectionLabel>
      {trash.map((i) => (
        <ItemRow key={i.id} item={i} collection={collections.find((c) => c.id === i.collectionId)} trailing={<Button label="Restore" variant="ghost" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => restoreItem(i.id)} />} />
      ))}
      {trash.length === 0 ? <Text v="meta">Trash is empty.</Text> : <Button label="Empty trash" variant="ghost" style={{ marginTop: 6 }} onPress={emptyTrash} />}
    </Screen>
  );
}
