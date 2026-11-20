import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, font, radius } from '../src/theme/tokens';
import { Button, Spacer } from '../src/ui/Button';
import { Icon } from '../src/ui/Icon';
import { Input } from '../src/ui/Inputs';
import { Header, Screen, SectionLabel, Segmented, useIsWide } from '../src/ui/Layout';
import { Pill } from '../src/ui/Chip';
import { Text } from '../src/ui/Text';
import { useAuth } from '../src/data/hooks';

type AuthMode = 'signin' | 'signup' | 'magic';

interface AuthScreenProps {
  isGate?: boolean;
}

export default function AuthScreen({ isGate = false }: AuthScreenProps) {
  const router = useRouter();
  const wide = useIsWide();
  const {
    user,
    loading,
    error,
    configured,
    isDemoMode,
    enableDemoMode,
    exitDemoMode,
    signInWithPassword,
    signUpWithPassword,
    sendMagicLink,
    verifyOtp,
    signOut,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = localError || error;

  const handleTabChange = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    clearError();
    setSuccessMessage(null);
  };

  const handleContinueWithDemo = () => {
    enableDemoMode();
    if (!isGate) {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  };

  const handleSignIn = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (!email.trim() || !password) {
      setLocalError('Please enter both your email and password.');
      return;
    }
    const res = await signInWithPassword(email, password);
    if (res.ok) {
      setSuccessMessage('Successfully signed in!');
      if (!isGate) {
        setTimeout(() => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }, 600);
      }
    }
  };

  const handleSignUp = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (!email.trim() || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    const res = await signUpWithPassword(email, password);
    if (res.ok) {
      setSuccessMessage(res.message ?? 'Account created successfully!');
    }
  };

  const handleSendMagicLink = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    const res = await sendMagicLink(email);
    if (res.ok) {
      setMagicLinkSent(true);
      setSuccessMessage(res.message ?? 'Magic link sent! Check your email.');
    }
  };

  const handleVerifyOtp = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (!email.trim() || !otpCode.trim()) {
      setLocalError('Please enter the 6-digit code received by email.');
      return;
    }
    const res = await verifyOtp(email, otpCode);
    if (res.ok) {
      setSuccessMessage('Code verified! Signed in.');
      if (!isGate) {
        setTimeout(() => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }, 600);
      }
    }
  };

  const handleSignOut = async () => {
    setSuccessMessage(null);
    await signOut();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setMagicLinkSent(false);
  };

  const headerTitle = user ? 'Account' : isDemoMode ? 'Account & Preview' : 'Sign in';
  const headerSubtitle = user
    ? 'Sync active across your devices'
    : isDemoMode
    ? 'Previewing with demo data · Sign in to save real cards'
    : 'Sign in to access your library or explore with demo data';

  return (
    <Screen>
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        onBack={!isGate && router.canGoBack() ? () => router.back() : undefined}
      />

      <View style={[styles.container, wide && styles.containerWide]}>
        {/* Brand Banner */}
        <View style={styles.brandHero}>
          <Image
            source={require('../assets/apple-touch-icon-180.png')}
            style={styles.heroLogo}
            accessibilityLabel="Pickle logo"
          />
          <View style={{ flex: 1 }}>
            <Text v="heading">Pickle</Text>
            <Text v="meta">Save everything, organize simply.</Text>
          </View>
        </View>

        {/* When user is already signed in */}
        {user ? (
          <View style={styles.card}>
            <View style={styles.signedInHeader}>
              <View style={styles.avatar}>
                <Text bold style={{ color: colors.accentInk, fontSize: 16 }}>
                  {(user.email[0] || 'U').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text bold numberOfLines={1} style={{ fontSize: 16 }}>
                  {user.email || 'Signed in'}
                </Text>
                <Text v="meta" numberOfLines={1}>
                  User ID: {user.id.slice(0, 12)}…
                </Text>
              </View>
              <Pill label="Active" tone="accent" />
            </View>

            <Spacer h={16} />
            <View style={styles.infoRow}>
              <Icon name="cloud" size={16} color={colors.accent} />
              <Text v="meta" color={colors.textBody} style={{ flex: 1 }}>
                Cloud sync is active. Your cards, collections, and reminders sync with Supabase.
              </Text>
            </View>

            <Spacer h={24} />
            {!isGate ? (
              <>
                <Button
                  label="Back to library"
                  variant="primary"
                  onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                />
                <Spacer h={12} />
              </>
            ) : null}
            <Button
              label="Sign out"
              variant="ghost"
              disabled={loading}
              onPress={handleSignOut}
            />
          </View>
        ) : null}

        {/* When in demo mode (opened from within the app) */}
        {!user && isDemoMode && !isGate ? (
          <View style={styles.card}>
            <View style={styles.signedInHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.warn }]}>
                <Text bold style={{ color: colors.accentInk, fontSize: 16 }}>D</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text bold style={{ fontSize: 16 }}>Demo Preview Mode</Text>
                <Text v="meta">Browsing sample cards & collections</Text>
              </View>
              <Pill label="Preview" tone="default" />
            </View>

            <Spacer h={16} />
            <View style={styles.infoRow}>
              <Icon name="eye" size={16} color={colors.warn} />
              <Text v="meta" color={colors.textBody} style={{ flex: 1 }}>
                You are currently previewing with local demo data. Changes are not synced to the cloud.
              </Text>
            </View>

            <Spacer h={20} />
            <Button
              label="Back to library"
              variant="primary"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <Spacer h={12} />
            <Button
              label="Exit demo & sign in"
              variant="ghost"
              onPress={() => {
                exitDemoMode();
              }}
            />
          </View>
        ) : null}

        {/* When NOT signed in (or on gate screen) */}
        {!user && (!isDemoMode || isGate) ? (
          <>
            {/* If backend credentials are not set in .env */}
            {!configured ? (
              <View style={[styles.card, styles.warningCard]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="warn" size={20} color={colors.warn} />
                  <Text bold color={colors.warn}>Supabase credentials not detected</Text>
                </View>
                <Spacer h={8} />
                <Text v="body" color={colors.textBody} style={{ fontSize: 13 }}>
                  Add your credentials to <Text bold color={colors.text}>apps/app/.env</Text> to test real cloud sign-in:
                </Text>
                <Spacer h={10} />
                <View style={styles.codeBox}>
                  <Text v="meta" style={{ fontFamily: font.medium, color: colors.accent }}>
                    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
                  </Text>
                  <Text v="meta" style={{ fontFamily: font.medium, color: colors.accent }}>
                    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
                  </Text>
                </View>
                <Spacer h={18} />
                <Button
                  label="Continue with demo data preview →"
                  variant="primary"
                  onPress={handleContinueWithDemo}
                />
              </View>
            ) : null}

            {/* If configured, show auth switcher + forms */}
            {configured ? (
              <View style={styles.card}>
                <Segmented
                  options={[
                    { value: 'signin', label: 'Sign in' },
                    { value: 'signup', label: 'Create account' },
                    { value: 'magic', label: 'Magic link' },
                  ]}
                  value={mode}
                  onChange={handleTabChange}
                />

                <Spacer h={20} />

                {/* Feedback banners */}
                {activeError ? (
                  <View style={styles.errorBox}>
                    <Icon name="warn" size={16} color={colors.danger} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.dangerText }}>{activeError}</Text>
                  </View>
                ) : null}

                {successMessage ? (
                  <View style={styles.successBox}>
                    <Icon name="check" size={16} color={colors.accent} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.text }}>{successMessage}</Text>
                  </View>
                ) : null}

                {/* Sign In Form */}
                {mode === 'signin' ? (
                  <View style={styles.form}>
                    <SectionLabel style={{ marginTop: 0 }}>Email address</SectionLabel>
                    <Input
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={(t) => { setEmail(t); setLocalError(null); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      leftIcon="ext"
                    />

                    <SectionLabel>Password</SectionLabel>
                    <Input
                      placeholder="Your password"
                      value={password}
                      onChangeText={(t) => { setPassword(t); setLocalError(null); }}
                      secureTextEntry
                      autoCapitalize="none"
                      leftIcon="set"
                    />

                    <Spacer h={24} />
                    <Button
                      label={loading ? 'Signing in…' : 'Sign in'}
                      variant="primary"
                      disabled={loading}
                      onPress={handleSignIn}
                    />
                    {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}

                    <Spacer h={16} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleTabChange('magic')}
                      style={{ alignItems: 'center', paddingVertical: 8 }}
                    >
                      <Text v="meta" color={colors.accent}>Prefer passwordless? Send magic link →</Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Create Account Form */}
                {mode === 'signup' ? (
                  <View style={styles.form}>
                    <SectionLabel style={{ marginTop: 0 }}>Email address</SectionLabel>
                    <Input
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={(t) => { setEmail(t); setLocalError(null); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      leftIcon="ext"
                    />

                    <SectionLabel>Create password</SectionLabel>
                    <Input
                      placeholder="At least 6 characters"
                      value={password}
                      onChangeText={(t) => { setPassword(t); setLocalError(null); }}
                      secureTextEntry
                      autoCapitalize="none"
                      leftIcon="set"
                    />

                    <SectionLabel>Confirm password</SectionLabel>
                    <Input
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setLocalError(null); }}
                      secureTextEntry
                      autoCapitalize="none"
                      leftIcon="set"
                    />

                    <Spacer h={24} />
                    <Button
                      label={loading ? 'Creating account…' : 'Create account'}
                      variant="primary"
                      disabled={loading}
                      onPress={handleSignUp}
                    />
                    {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}

                    <Spacer h={16} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleTabChange('signin')}
                      style={{ alignItems: 'center', paddingVertical: 8 }}
                    >
                      <Text v="meta">Already have an account? <Text bold color={colors.accent}>Sign in</Text></Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Magic Link Form */}
                {mode === 'magic' ? (
                  <View style={styles.form}>
                    <SectionLabel style={{ marginTop: 0 }}>Email address</SectionLabel>
                    <Input
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={(t) => { setEmail(t); setLocalError(null); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      leftIcon="ext"
                    />

                    <Spacer h={20} />
                    <Button
                      label={loading ? 'Sending link…' : magicLinkSent ? 'Resend magic link' : 'Send magic link'}
                      variant="primary"
                      disabled={loading}
                      onPress={handleSendMagicLink}
                    />
                    {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} /> : null}

                    {magicLinkSent ? (
                      <>
                        <Spacer h={24} />
                        <SectionLabel>Or enter the 6-digit code</SectionLabel>
                        <Input
                          placeholder="123456"
                          value={otpCode}
                          onChangeText={(t) => { setOtpCode(t); setLocalError(null); }}
                          keyboardType="number-pad"
                          maxLength={8}
                          leftIcon="task"
                        />
                        <Spacer h={16} />
                        <Button
                          label={loading ? 'Verifying…' : 'Verify code'}
                          variant="ghost"
                          disabled={loading}
                          onPress={handleVerifyOtp}
                        />
                      </>
                    ) : null}

                    <Spacer h={16} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleTabChange('signin')}
                      style={{ alignItems: 'center', paddingVertical: 8 }}
                    >
                      <Text v="meta">Prefer password sign-in? <Text bold color={colors.accent}>Sign in here</Text></Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Prominent Demo Data Preview Button */}
            <View style={styles.demoCard}>
              <View style={styles.demoHeader}>
                <View style={styles.demoIconBadge}>
                  <Icon name="eye" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text bold style={{ fontSize: 15 }}>Just exploring?</Text>
                  <Text v="meta" color={colors.textBody} style={{ marginTop: 2 }}>
                    Preview all 13 collections, sample cards, and reminder filters with local demo data.
                  </Text>
                </View>
              </View>
              <Spacer h={14} />
              <Button
                label="Continue with demo data preview →"
                variant="ghost"
                onPress={handleContinueWithDemo}
                style={styles.demoBtn}
              />
            </View>

            {/* Privacy note */}
            <View style={styles.footerNote}>
              <Icon name="ext" size={14} color={colors.faint} />
              <Text v="meta" color={colors.faint} style={{ flex: 1, fontSize: 11 }}>
                Protected with Supabase Row Level Security. Your data belongs to you.
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  containerWide: {
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  brandHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.chrome,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#262622',
  },
  heroLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A26',
  },
  demoCard: {
    backgroundColor: colors.surfaceHi,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#33332E',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demoIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtn: {
    borderWidth: 1,
    borderColor: '#3A3A35',
  },
  warningCard: {
    backgroundColor: 'rgba(229,181,103,0.08)',
    borderColor: 'rgba(229,181,103,0.25)',
  },
  codeBox: {
    backgroundColor: '#161614',
    padding: 12,
    borderRadius: radius.md,
    gap: 4,
    borderWidth: 1,
    borderColor: '#282824',
  },
  form: {
    marginTop: 4,
  },
  signedInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.md,
    padding: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(207,102,121,0.3)',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,225,87,0.3)',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginTop: 10,
  },
});
