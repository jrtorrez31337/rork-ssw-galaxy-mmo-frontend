import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Shield,
  Key,
  Monitor,
  Smartphone,
  Trash2,
  ChevronLeft,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text, Button, Spinner, Divider } from '@/ui';
import { tokens } from '@/ui/theme';
import { authApi, Session } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Settings Screen
 *
 * Per Gap Analysis Sprint 3:
 * - Session management (view/revoke sessions)
 * - Password change
 * - Display preferences
 * - Account management
 */

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  // Display settings from store
  const {
    showCoordinates,
    compactMode,
    profanityFilterEnabled,
    chatNotificationsEnabled,
    setShowCoordinates,
    setCompactMode,
    setProfanityFilter,
    setChatNotifications,
  } = useSettingsStore();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch sessions
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authApi.getSessions(),
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert('Success', 'Session revoked successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to revoke session');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      Alert.alert(
        'Password Changed',
        'Your password has been updated. All other sessions have been logged out.',
        [{ text: 'OK' }]
      );
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to change password');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: (data) => {
      Alert.alert(
        'Account Scheduled for Deletion',
        `Your account will be deleted on ${new Date(data.deletion_scheduled_at).toLocaleDateString()}. You can cancel this by logging in again.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/login');
            },
          },
        ]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete account');
    },
  });

  const handleRevokeSession = (session: Session) => {
    if (session.is_current) {
      Alert.alert(
        'Cannot Revoke Current Session',
        'You cannot revoke your current session. Use logout instead.'
      );
      return;
    }

    Alert.alert(
      'Revoke Session',
      `Are you sure you want to log out the session from ${session.device_info || 'Unknown Device'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => revokeSessionMutation.mutate(session.session_id),
        },
      ]
    );
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will be scheduled for deletion in 30 days. You can cancel by logging in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Settings size={24} color={tokens.colors.primary.main} />
          <Text variant="title" weight="bold">
            Settings
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Display Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Monitor size={20} color={tokens.colors.primary.main} />
            <Text variant="heading" weight="semibold">
              Display
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="body">Show Coordinates</Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Display sector coordinates in UI
              </Text>
            </View>
            <Switch
              value={showCoordinates}
              onValueChange={setShowCoordinates}
              trackColor={{
                false: tokens.colors.surface.raised,
                true: tokens.colors.primary.main,
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="body">Compact Mode</Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Reduce UI element sizes
              </Text>
            </View>
            <Switch
              value={compactMode}
              onValueChange={setCompactMode}
              trackColor={{
                false: tokens.colors.surface.raised,
                true: tokens.colors.primary.main,
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="body">Profanity Filter</Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Filter inappropriate content in chat
              </Text>
            </View>
            <Switch
              value={profanityFilterEnabled}
              onValueChange={setProfanityFilter}
              trackColor={{
                false: tokens.colors.surface.raised,
                true: tokens.colors.primary.main,
              }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="body">Chat Notifications</Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Receive notifications for new messages
              </Text>
            </View>
            <Switch
              value={chatNotificationsEnabled}
              onValueChange={setChatNotifications}
              trackColor={{
                false: tokens.colors.surface.raised,
                true: tokens.colors.primary.main,
              }}
            />
          </View>
        </View>

        <Divider />

        {/* Security Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={tokens.colors.primary.main} />
            <Text variant="heading" weight="semibold">
              Security
            </Text>
          </View>

          {/* Password Change */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
          >
            <View style={styles.actionIcon}>
              <Key size={20} color={tokens.colors.text.secondary} />
            </View>
            <View style={styles.actionInfo}>
              <Text variant="body">Change Password</Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Update your account password
              </Text>
            </View>
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Current Password"
                  placeholderTextColor={tokens.colors.text.tertiary}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={tokens.colors.text.tertiary} />
                  ) : (
                    <Eye size={20} color={tokens.colors.text.tertiary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor={tokens.colors.text.tertiary}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color={tokens.colors.text.tertiary} />
                  ) : (
                    <Eye size={20} color={tokens.colors.text.tertiary} />
                  )}
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor={tokens.colors.text.tertiary}
                secureTextEntry={!showNewPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Button
                variant="primary"
                onPress={handleChangePassword}
                loading={changePasswordMutation.isPending}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Update Password
              </Button>
            </View>
          )}
        </View>

        <Divider />

        {/* Active Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Smartphone size={20} color={tokens.colors.primary.main} />
            <Text variant="heading" weight="semibold">
              Active Sessions
            </Text>
            <TouchableOpacity
              onPress={() => refetchSessions()}
              style={styles.refreshButton}
            >
              <RefreshCw size={18} color={tokens.colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {loadingSessions ? (
            <View style={styles.loadingContainer}>
              <Spinner size="small" />
            </View>
          ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {sessionsData.sessions.map((session) => (
                <View
                  key={session.session_id}
                  style={[
                    styles.sessionCard,
                    session.is_current && styles.currentSession,
                  ]}
                >
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionHeader}>
                      <Text variant="body" weight="semibold">
                        {session.device_info || 'Unknown Device'}
                      </Text>
                      {session.is_current && (
                        <View style={styles.currentBadge}>
                          <Text
                            variant="caption"
                            weight="bold"
                            color={tokens.colors.success}
                          >
                            CURRENT
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text variant="caption" color={tokens.colors.text.secondary}>
                      IP: {session.ip_address}
                    </Text>
                    <Text variant="caption" color={tokens.colors.text.tertiary}>
                      Last active: {formatDate(session.last_active_at)}
                    </Text>
                  </View>
                  {!session.is_current && (
                    <TouchableOpacity
                      onPress={() => handleRevokeSession(session)}
                      style={styles.revokeButton}
                      disabled={revokeSessionMutation.isPending}
                    >
                      <LogOut size={18} color={tokens.colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text variant="caption" color={tokens.colors.text.secondary}>
              No active sessions found
            </Text>
          )}
        </View>

        <Divider />

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color={tokens.colors.danger} />
            <Text variant="heading" weight="semibold" color={tokens.colors.danger}>
              Danger Zone
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
          >
            <View style={styles.actionInfo}>
              <Text variant="body" color={tokens.colors.danger}>
                Delete Account
              </Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Permanently delete your account (30-day grace period)
              </Text>
            </View>
            {deleteAccountMutation.isPending && <Spinner size="small" />}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    backgroundColor: tokens.colors.surface.base,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  content: {
    flex: 1,
  },
  section: {
    padding: tokens.spacing[5],
    gap: tokens.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: tokens.spacing[2],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[2],
  },
  settingInfo: {
    flex: 1,
    marginRight: tokens.spacing[4],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.spacing[4],
  },
  actionIcon: {
    marginRight: tokens.spacing[3],
  },
  actionInfo: {
    flex: 1,
  },
  passwordForm: {
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.fontSize.md,
  },
  eyeButton: {
    position: 'absolute',
    right: tokens.spacing[3],
    padding: tokens.spacing[2],
  },
  loadingContainer: {
    padding: tokens.spacing[4],
    alignItems: 'center',
  },
  sessionsList: {
    gap: tokens.spacing[3],
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  currentSession: {
    borderColor: tokens.colors.success,
  },
  sessionInfo: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  currentBadge: {
    backgroundColor: tokens.colors.success + '20',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },
  revokeButton: {
    padding: tokens.spacing[2],
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: tokens.colors.danger + '10',
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.danger + '30',
  },
  bottomSpacer: {
    height: tokens.spacing[8],
  },
});
