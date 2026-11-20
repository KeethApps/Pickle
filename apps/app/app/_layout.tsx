import React, { useEffect } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { colors } from '../src/theme/tokens';
import { Sidebar } from '../src/features/Sidebar';
import { Snackbar } from '../src/features/Snackbar';
import { useIsWide } from '../src/ui/Layout';
import { useAuthStore } from '../src/data/auth';
import AuthScreen from './auth';

const modal = { presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } } as const;

function Shell() {
  const wide = useIsWide();
  const user = useAuthStore((s) => s.user);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);

  const canAccessApp = !!user || isDemoMode;

  if (!initialized && loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('../assets/apple-touch-icon-180.png')}
          style={{ width: 64, height: 64, borderRadius: 16 }}
        />
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // When not logged in and not in demo mode, show the Sign In screen first
  if (!canAccessApp) {
    return <AuthScreen isGate />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {wide ? <Sidebar /> : null}
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="paste" options={modal} />
          <Stack.Screen name="share" options={modal} />
          <Stack.Screen name="new/index" options={modal} />
          <Stack.Screen name="sort/[itemId]" options={modal} />
          <Stack.Screen name="item/[id]/remind" options={modal} />
          <Stack.Screen name="c/[id]/filters" options={modal} />
          <Stack.Screen name="auth" />
          <Stack.Screen name="login" />
        </Stack>
        <Snackbar />
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Shell />
    </SafeAreaProvider>
  );
}
