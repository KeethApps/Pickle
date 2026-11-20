import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/tokens';
import { Icon } from '../../src/ui/Icon';
import { Toggle } from '../../src/ui/Inputs';
import { Header, Row, Screen, SectionLabel } from '../../src/ui/Layout';
import { Pill } from '../../src/ui/Chip';
import { Text } from '../../src/ui/Text';
import { useAuth, useCollections } from '../../src/data/hooks';
import { useStore } from '../../src/data/store';

function Line({ icon, title, sub, right, onPress }: { icon: string; title: string; sub?: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress}>
      <Row>
        <Icon name={icon} size={18} color={colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14 }}>{title}</Text>
          {sub ? <Text v="meta">{sub}</Text> : null}
        </View>
        {right ?? (onPress ? <Icon name="chev" size={16} color={colors.faint} /> : null)}
      </Row>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resetDemo = useStore((s) => s.resetDemo);
  const collections = useCollections();
  const { user, configured, isDemoMode } = useAuth();

  return (
    <Screen>
      <Header title="Settings" />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/auth')}
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={{ backgroundColor: colors.accentSoft, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={user ? 'check' : isDemoMode ? 'eye' : 'cloud'} size={22} color={colors.accentInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text bold>{user ? (user.email || 'Account connected') : isDemoMode ? 'Demo Preview Active' : configured ? 'Sign in to Pickle' : 'Demo data on this device'}</Text>
            <Text v="meta" color={colors.textBody}>
              {user ? 'Tap to view account details or sign out' : isDemoMode ? 'Browsing sample cards · Tap to sign in or manage' : configured ? 'Tap to sign in or create an account to sync' : 'Add the Supabase keys in apps/app/.env to turn sync on.'}
            </Text>
          </View>
          <Pill label={user ? 'Active' : isDemoMode ? 'Preview' : configured ? 'Sign in' : 'Off'} tone="accent" />
        </View>
      </Pressable>

      <SectionLabel>Account</SectionLabel>
      <Line
        icon="cloud"
        title={user ? (user.email || 'Signed in') : isDemoMode ? 'Demo Preview Active' : 'Sign in / Sign up'}
        sub={user ? 'Cloud sync active · Tap to manage or sign out' : isDemoMode ? 'Browsing demo data · Tap to sign in with your account' : 'Connect to your Supabase backend to sync cards'}
        onPress={() => router.push('/auth')}
      />

      <SectionLabel>Devices</SectionLabel>
      <Line icon="laptop" title="Laptop" sub="Shows here once you sign in on the web app" />
      <Line icon="set" title="This phone" sub="Reminders fire here" />

      <SectionLabel>Notifications</SectionLabel>
      <Line icon="bell" title="Weekly Rediscover" sub={`${settings.rediscoverDay}, 10:00`} right={<Toggle on={settings.rediscoverOn} onChange={(v) => setSettings({ rediscoverOn: v })} label="Weekly Rediscover" />} />
      <Line icon="clock" title="Default reminder time" sub={settings.defaultReminderTime} />

      <SectionLabel>Data</SectionLabel>
      <Line icon="eye" title="Link previews" sub="Fetch cover and title when saving" right={<Toggle on={settings.previews} onChange={(v) => setSettings({ previews: v })} label="Link previews" />} />
      <Line icon="dl" title="Backup, export and trash" sub="JSON, CSV per collection, restore" onPress={() => router.push('/settings/backup')} />
      <Line icon="doc" title="Tidy up" sub="Old, unopened and dead links" onPress={() => router.push('/tidy')} />
      <Line icon="plus" title="New collection" sub="Pick fields from the library" onPress={() => router.push('/collections/new')} />

      <SectionLabel>Statuses</SectionLabel>
      {collections.map((c) => <Line key={c.id} icon={c.icon} title={c.name} sub={c.statuses.map((s) => s.label).join(' → ')} onPress={() => router.push(`/c/${c.id}/statuses`)} />)}

      <SectionLabel>Demo</SectionLabel>
      <Line icon="repeat" title="Reset demo data" sub="Restores the sample cards" onPress={resetDemo} />
    </Screen>
  );
}
