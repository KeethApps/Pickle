import React from 'react';
import { Tabs } from 'expo-router';
import { colors, font } from '../../src/theme/tokens';
import { Icon } from '../../src/ui/Icon';
import { useIsWide } from '../../src/ui/Layout';
import { useStore } from '../../src/data/store';

export default function TabsLayout() {
  const wide = useIsWide();
  const inbox = useStore((s) => s.items.filter((i) => i.stage === 'inbox' && !i.deletedAt).length);
  const due = useStore((s) => s.reminders.filter((r) => !r.doneAt).length);
  const badge = { backgroundColor: colors.accent, color: colors.accentInk, fontFamily: font.bold, fontSize: 10 };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 10 },
        tabBarStyle: wide ? { display: 'none' } : { backgroundColor: colors.chrome, borderTopColor: '#2A2A2A', height: 84, paddingTop: 8 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inbox', tabBarBadge: inbox || undefined, tabBarBadgeStyle: badge, tabBarIcon: ({ color }) => <Icon name="inbox" size={22} color={color as string} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ color }) => <Icon name="lib" size={22} color={color as string} /> }} />
      <Tabs.Screen name="reminders" options={{ title: 'Reminders', tabBarBadge: due || undefined, tabBarBadgeStyle: { ...badge, backgroundColor: colors.surfaceTop, color: colors.text }, tabBarIcon: ({ color }) => <Icon name="bell" size={22} color={color as string} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Icon name="set" size={22} color={color as string} /> }} />
    </Tabs>
  );
}
