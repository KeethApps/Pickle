import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/tokens';
import { Button, IconButton } from '../../src/ui/Button';
import { Icon } from '../../src/ui/Icon';
import { Header, Screen, useIsWide } from '../../src/ui/Layout';
import { Text } from '../../src/ui/Text';
import { InboxCard } from '../../src/features/InboxCard';
import { InboxWide } from '../../src/features/InboxWide';
import { useInbox } from '../../src/data/hooks';
import { useStore } from '../../src/data/store';
import { Pressable } from 'react-native';

function ActionButton({ icon, label, onPress, big }: { icon: string; label: string; onPress: () => void; big?: boolean }) {
  const size = big ? 72 : 56;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: big ? colors.accent : colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={big ? 26 : 22} color={big ? colors.accentInk : colors.text} strokeWidth={big ? 2 : 1.8} />
      </View>
      <Text v="meta" color={big ? colors.text : colors.muted}>{label}</Text>
    </Pressable>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const wide = useIsWide();
  const inbox = useInbox();
  const deleteItem = useStore((s) => s.deleteItem);
  if (wide) return <InboxWide />;

  const top = inbox[0];
  return (
    <Screen>
      <Header title="Inbox" subtitle={inbox.length ? `${inbox.length} to sort` : 'All sorted'} right={<IconButton icon="plus" label="Paste a link" onPress={() => router.push('/paste')} />} />
      {top ? (
        <>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
            {inbox.slice(0, 6).map((it, i) => <View key={it.id} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i === 0 ? colors.accent : colors.line }} />)}
          </View>
          <InboxCard
            item={top}
            onDelete={() => deleteItem(top.id)}
            onSort={() => router.push(`/sort/${top.id}`)}
            onRemind={() => router.push(`/item/${top.id}/remind`)}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 30, marginTop: 40 }}>
            <ActionButton icon="trash" label="Delete" onPress={() => deleteItem(top.id)} />
            <ActionButton icon="up" label="Sort" big onPress={() => router.push(`/sort/${top.id}`)} />
            <ActionButton icon="bell" label="Remind" onPress={() => router.push(`/item/${top.id}/remind`)} />
          </View>
          <Text v="meta" style={{ textAlign: 'center', marginTop: 20 }}>Swipe the card, or tap</Text>
        </>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 90 }}>
          <View style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <Icon name="check" size={48} color={colors.accent} strokeWidth={2} />
          </View>
          <Text v="title" style={{ fontSize: 24 }}>Inbox zero</Text>
          <Text color={colors.muted} style={{ textAlign: 'center', marginTop: 10, maxWidth: 260 }}>Share any link or reel to Pickle and it waits here until you sort it.</Text>
          <View style={{ gap: 10, marginTop: 28, width: 220 }}>
            <Button label="Paste a link" icon="link" onPress={() => router.push('/paste')} />
            <Button label="Review in Tidy up" variant="ghost" onPress={() => router.push('/tidy')} />
          </View>
        </View>
      )}
    </Screen>
  );
}
