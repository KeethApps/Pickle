import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BUILTIN_COLLECTIONS } from '@pickle/core';
import { colors } from '../src/theme/tokens';
import { Button } from '../src/ui/Button';
import { Chip, ChipRow, Pill } from '../src/ui/Chip';
import { Cover } from '../src/ui/Cover';
import { Icon } from '../src/ui/Icon';
import { Input } from '../src/ui/Inputs';
import { Sheet } from '../src/ui/Sheet';
import { Text } from '../src/ui/Text';
import { useCollection, useItem } from '../src/data/hooks';
import { suggestFor, useStore } from '../src/data/store';

/** Confirmation after saving a link, or the "Already saved" card when it was a duplicate. */
export default function ShareSheet() {
  const { id, dup } = useLocalSearchParams<{ id?: string; dup?: string }>();
  const router = useRouter();
  const item = useItem(id ?? dup);
  const history = useStore((s) => s.history);
  const patchItem = useStore((s) => s.patchItem);
  const collection = useCollection(item?.collectionId ?? undefined);
  const [title, setTitle] = useState(item?.title ?? '');
  if (!item) return null;

  if (dup) {
    return (
      <Sheet>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accentSoft, borderRadius: 14, padding: 12 }}>
          <Icon name="repeat" size={18} color={colors.accent} />
          <Text color={colors.accent} style={{ fontFamily: 'Poppins_500Medium', fontSize: 13 }}>
            {item.stage === 'inbox' ? 'Already in your Inbox' : `Already saved in ${collection?.name ?? 'your library'}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 18 }}>
          <Cover tint={collection?.color ?? colors.accent} icon={collection?.icon ?? 'link'} width={84} height={84} radius={16} />
          <View style={{ flex: 1 }}>
            <Text v="heading">{item.title}</Text>
            <Text v="meta" style={{ marginTop: 4 }}>Opened {item.openCount} time{item.openCount === 1 ? '' : 's'}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>{collection ? <Pill label={collection.name} tone="accent" /> : null}</View>
          </View>
        </View>
        <Text v="meta" style={{ marginTop: 16 }}>The link matched after removing tracking parameters, so no second copy was added.</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Button label="Close" variant="ghost" style={{ flex: 1 }} onPress={() => router.back()} />
          <Button label="Open card" style={{ flex: 1.4 }} onPress={() => router.replace(item.stage === 'inbox' ? '/' : `/item/${item.id}`)} />
        </View>
      </Sheet>
    );
  }

  const suggestedKey = suggestFor(item, history);
  const suggested = BUILTIN_COLLECTIONS.find((c) => c.builtinKey === suggestedKey);
  const quick = ['recipes', 'workouts', 'restaurants'].filter((k) => k !== suggested?.builtinKey).slice(0, suggested ? 2 : 3);
  const chips = [suggested, ...quick.map((k) => BUILTIN_COLLECTIONS.find((c) => c.builtinKey === k))].filter(Boolean) as typeof BUILTIN_COLLECTIONS;

  return (
    <Sheet>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={18} color={colors.accentInk} strokeWidth={2.4} /></View>
        <View style={{ flex: 1 }}>
          <Text v="heading" style={{ fontSize: 17 }}>Saved to Pickle</Text>
          <Text v="meta">Inbox · works offline</Text>
        </View>
      </View>
      <Text v="meta" style={{ marginBottom: 6 }}>Title, from the link · tap to edit</Text>
      <Input value={title} onChangeText={setTitle} onBlur={() => patchItem(item.id, { title })} />
      <Text v="caps" style={{ marginTop: 20, marginBottom: 8 }}>Sort to</Text>
      <ChipRow>
        {chips.map((c) => <Chip key={c.id} label={c.name} icon={c.icon} on={c.id === suggested?.id} onPress={() => { patchItem(item.id, { title }); router.replace({ pathname: `/item/${item.id}/edit`, params: { collectionId: c.id } }); }} />)}
        <Chip label="More" icon="more" onPress={() => { patchItem(item.id, { title }); router.replace(`/sort/${item.id}`); }} />
      </ChipRow>
      {suggested ? <Text v="meta" style={{ marginTop: 10 }}>{suggested.name} suggested from the link. Nothing is sorted until you choose.</Text> : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
        <Button label="Done" variant="ghost" style={{ flex: 1 }} onPress={() => { patchItem(item.id, { title }); router.back(); }} />
        <Button label="Sort now" style={{ flex: 1.4 }} onPress={() => { patchItem(item.id, { title }); router.replace(`/sort/${item.id}`); }} />
      </View>
    </Sheet>
  );
}
