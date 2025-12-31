import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Rocket, User, Lock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { tokens } from '@/ui/theme';
import { validateEmail } from '@/utils/validation';

/**
 * LoginScreen - Command Terminal Authentication
 * Full terminal aesthetic with CRT effects and animated glow
 */

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, isLoggingIn, loginError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Animation refs
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Logo glow pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();

    // Scanline animation
    const scanline = Animated.loop(
      Animated.timing(scanlineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    scanline.start();

    return () => {
      pulse.stop();
      scanline.stop();
    };
  }, [fadeAnim, glowAnim, scanlineAnim]);

  const handleLogin = async () => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Enter your terminal ID (email)');
      return;
    }

    const emailResult = validateEmail(email.trim());
    if (!emailResult.isValid) {
      setLocalError(emailResult.error!);
      return;
    }

    if (!password.trim()) {
      setLocalError('Enter your access code (password)');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.replace('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const scanlineTranslate = scanlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 800],
  });

  const displayError = localError || (loginError ? loginError.message : null);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Scanline effect overlay */}
      <Animated.View
        style={[
          styles.scanline,
          { transform: [{ translateY: scanlineTranslate }] },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with animated logo */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.logoContainer, { opacity: glowOpacity }]}>
            <Rocket size={48} color={tokens.colors.command.blue} />
          </Animated.View>
          <Text style={styles.title}>STARSCAPE</Text>
          <Text style={styles.subtitle}>COMMAND TERMINAL</Text>
          <View style={styles.divider} />
          <Text style={styles.versionText}>v2.4.7 // FLEET OPERATIONS</Text>
        </Animated.View>

        {/* Login form container */}
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          {/* Terminal header with traffic light dots */}
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDot} />
            <View style={[styles.terminalDot, styles.terminalDotYellow]} />
            <View style={[styles.terminalDot, styles.terminalDotGreen]} />
            <Text style={styles.terminalTitle}>AUTHENTICATION REQUIRED</Text>
          </View>

          <View style={styles.form}>
            {/* Email input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TERMINAL ID</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={tokens.colors.text.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="pilot@starscape.com"
                  placeholderTextColor={tokens.colors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoggingIn}
                  maxLength={254}
                  testID="login-email"
                />
              </View>
            </View>

            {/* Password input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCESS CODE</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={tokens.colors.text.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={tokens.colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoggingIn}
                  maxLength={128}
                  testID="login-password"
                />
              </View>
            </View>

            {/* Error display */}
            {displayError && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={tokens.colors.alert.critical} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
              activeOpacity={0.8}
              testID="login-button"
            >
              {isLoggingIn ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={tokens.colors.console.void} />
                  <Text style={styles.loginButtonText}>AUTHENTICATING...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>INITIALIZE SESSION</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Status bar */}
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>SECURE CHANNEL ACTIVE</Text>
            <View style={styles.statusIndicator} />
          </View>
        </Animated.View>

        {/* Footer with signup link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>NEW PILOT? </Text>
          <TouchableOpacity onPress={() => router.replace('/signup')}>
            <Text style={styles.footerLink}>REQUEST ACCESS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerLegal}>
          FLEET COMMAND // AUTHORIZED ACCESS ONLY
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.console.void,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tokens.colors.console.deepSpace,
    borderWidth: 2,
    borderColor: tokens.colors.command.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.lg,
    shadowColor: tokens.colors.command.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  title: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: 32,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.command.blue,
    letterSpacing: 8,
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.muted,
    letterSpacing: 4,
  },
  divider: {
    width: 100,
    height: 1,
    backgroundColor: tokens.colors.border.default,
    marginVertical: tokens.spacing.md,
  },
  versionText: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.muted,
    letterSpacing: 2,
  },
  formContainer: {
    backgroundColor: tokens.colors.console.deepSpace,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.console.hull,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.xs,
  },
  terminalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.alert.critical,
  },
  terminalDotYellow: {
    backgroundColor: tokens.colors.alert.warning,
  },
  terminalDotGreen: {
    backgroundColor: tokens.colors.status.online,
  },
  terminalTitle: {
    flex: 1,
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.muted,
    textAlign: 'center',
    letterSpacing: 2,
  },
  form: {
    padding: tokens.spacing.lg,
  },
  inputGroup: {
    marginBottom: tokens.spacing.lg,
  },
  inputLabel: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.command.blue,
    letterSpacing: 2,
    marginBottom: tokens.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.console.hull,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.text.primary,
    paddingVertical: tokens.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.alert.critical,
  },
  loginButton: {
    backgroundColor: tokens.colors.command.blue,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  loginButtonText: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.console.void,
    letterSpacing: 2,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    gap: tokens.spacing.sm,
  },
  statusText: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.status.online,
    letterSpacing: 1,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.online,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: tokens.spacing.xl,
  },
  footerText: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  footerLink: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.command.blue,
    fontWeight: tokens.typography.fontWeight.bold,
    letterSpacing: 1,
  },
  footerLegal: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.muted,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: tokens.spacing.xxl,
  },
});
