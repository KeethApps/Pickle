import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { useAuth, useCollections } from '../data/hooks';
import { useStore } from '../data/store';

function NavItem({ icon, label, count, active, tint, onPress }: { icon: string; label: string; count?: number; active?: boolean; tint?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={[styles.item, active && { backgroundColor: colors.surfaceTop }]}>
      <Icon name={icon} size={17} color={tint ?? (active ? colors.text : colors.muted)} />
      <Text style={{ flex: 1, fontSize: 13 }} color={active ? colors.text : colors.muted}>{label}</Text>
      {count ? <Text v="meta">{count}</Text> : null}
    </Pressable>
  );
}

/** Laptop navigation. Shown at widths of 900 and above. */
export function Sidebar() {
  const router = useRouter();
  const path = usePathname();
  const collections = useCollections();
  const items = useStore((s) => s.items);
  const reminders = useStore((s) => s.reminders);
  const inbox = items.filter((i) => i.stage === 'inbox' && !i.deletedAt).length;
  const due = reminders.filter((r) => !r.doneAt).length;

  const { user, isDemoMode } = useAuth();

  const profileName = user
    ? (user.email ? user.email.split('@')[0] : 'User')
    : 'Demo Preview';
  const profileSub = user
    ? user.email
    : 'Local demo data';
  const avatarLetter = (profileName[0] || 'P').toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <Image
          source={require('../../assets/apple-touch-icon-180.png')}
          style={styles.logo}
          accessibilityLabel="Pickle icon"
        />
        <Text bold style={{ fontSize: 18 }}>Pickle</Text>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <NavItem icon="inbox" label="Inbox" count={inbox} active={path === '/'} onPress={() => router.navigate('/')} />
        <NavItem icon="lib" label="Library" active={path === '/library'} onPress={() => router.navigate('/library')} />
        <NavItem icon="bell" label="Reminders" count={due} active={path === '/reminders'} onPress={() => router.navigate('/reminders')} />
        <NavItem icon="doc" label="Tidy up" active={path === '/tidy'} onPress={() => router.navigate('/tidy')} />
        <Text v="caps" style={{ marginTop: 22, marginBottom: 6, paddingHorizontal: 10 }}>Collections</Text>
        {collections.map((c) => (
          <NavItem key={c.id} icon={c.icon} label={c.name} tint={c.color} active={path === `/c/${c.id}`} onPress={() => router.navigate(`/c/${c.id}`)} />
        ))}
        <View style={{ height: 12 }} />
        <NavItem icon="set" label="Settings" active={path.startsWith('/settings')} onPress={() => router.navigate('/settings')} />
      </ScrollView>

      {/* Profile name and small profile icon at the bottom of the navbar */}
      <View style={styles.profileSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Profile: ${profileName}`}
          onPress={() => router.push('/auth')}
          style={({ pressed }) => [styles.profileCard, pressed && { backgroundColor: colors.surfaceTop }]}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text bold style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: user ? colors.accent : colors.warn }]} />
          </View>
          <View style={styles.profileMeta}>
            <Text bold numberOfLines={1} style={{ fontSize: 13 }}>{profileName}</Text>
            <Text v="meta" numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>{profileSub}</Text>
          </View>
          <Icon name="chev" size={14} color={colors.faint} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 240, backgroundColor: colors.chrome, paddingVertical: 24, paddingHorizontal: 14, height: '100%', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingBottom: 20 },
  logo: { width: 28, height: 28, borderRadius: 8, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, minHeight: 38, borderRadius: 10 },
  profileSection: { paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: '#282824' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceHi },
  avatarWrap: { position: 'relative' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceTop, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontSize: 13 },
  statusDot: { position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: colors.surfaceHi },
  profileMeta: { flex: 1, minWidth: 0 },
});
