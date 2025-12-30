import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, X, MessageCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { chatApi } from '@/api/chat';
import { useChatEvents } from '@/hooks/useChatEvents';
import { ChatRoom, ChatMessage, ChatEvent } from '@/types/chat';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { getDisplayText, containsProfanity } from '@/utils/profanityFilter';

// Rate limiting constants
const RATE_LIMIT_MESSAGES = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

interface FailedMessage {
  id: string;
  room_id: string;
  content: string;
  attempts: number;
  error: string;
}

interface ChatPanelProps {
  playerId: string;
  factionId?: string;
  currentSector?: string;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Chat Panel (Side Panel)
 * According to B1-ux-system-definition.md (lines 330-371)
 *
 * Features:
 * - Room tabs (Sector, Faction, DM, Global)
 * - Real-time message delivery via SSE
 * - Auto-join sector chat on sector change
 * - Unread count in collapsed state
 * - Message history persistence
 * - Client-side profanity filter (user toggleable)
 * - Rate limiting feedback
 * - Retry logic for failed messages
 * - Auto-join global chat for all players
 * - Auto-join faction chat if player has a faction
 * - Default to faction chat if available, otherwise global
 */
export function ChatPanel({ playerId, factionId, currentSector, isVisible, onClose }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);

  // Rate limiting state
  const [messageTimes, setMessageTimes] = useState<number[]>([]);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

  // Failed messages for retry
  const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);

  // Settings
  const { profanityFilterEnabled, setProfanityFilter } = useSettingsStore();

  // Notifications
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Fetch available rooms
  const { data: roomsData, isLoading: roomsLoading, error: roomsError } = useQuery({
    queryKey: ['chat', 'rooms', playerId],
    queryFn: () => chatApi.getRooms(playerId),
    enabled: isVisible && !!playerId,
  });

  const rooms = roomsData?.rooms || [];

  // Find special rooms
  const globalRoom = rooms.find((r) => r.room_type === 'global');
  const factionRoom = rooms.find((r) => r.room_type === 'faction');
  const sectorRoom = rooms.find(
    (r) => r.room_type === 'sector' && r.name.includes(currentSector || '')
  );

  // Track if we've done initial room setup
  const hasInitializedRooms = useRef(false);

  // Auto-join global and faction rooms on first load
  useEffect(() => {
    if (hasInitializedRooms.current || rooms.length === 0) return;

    // Auto-join global chat (all players)
    if (globalRoom && !globalRoom.is_joined) {
      joinRoom(globalRoom.room_id);
    }

    // Auto-join faction chat if player has a faction
    if (factionId && factionRoom && !factionRoom.is_joined) {
      joinRoom(factionRoom.room_id);
    }

    // Set default selected room: faction > global > first available
    if (!selectedRoomId) {
      if (factionRoom) {
        setSelectedRoomId(factionRoom.room_id);
      } else if (globalRoom) {
        setSelectedRoomId(globalRoom.room_id);
      } else if (rooms.length > 0) {
        setSelectedRoomId(rooms[0].room_id);
      }
    }

    hasInitializedRooms.current = true;
  }, [rooms, globalRoom, factionRoom, factionId, selectedRoomId]);

  // Auto-join sector room when sector changes
  useEffect(() => {
    if (sectorRoom && !sectorRoom.is_joined) {
      joinRoom(sectorRoom.room_id);
    }
  }, [sectorRoom?.room_id]);

  // Subscribe to chat events
  useChatEvents(playerId, (event: ChatEvent) => {
    if (event.type === 'CHAT_MESSAGE') {
      const message = event.data;

      // Add message to state
      setMessages((prev) => ({
        ...prev,
        [message.room_id]: [...(prev[message.room_id] || []), message],
      }));

      // Increment unread count if not viewing this room
      if (message.room_id !== selectedRoomId && message.sender_id !== playerId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.room_id]: (prev[message.room_id] || 0) + 1,
        }));
      }

      // Auto-scroll to bottom
      if (message.room_id === selectedRoomId) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  });

  // Check rate limit
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const recentMessages = messageTimes.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

    if (recentMessages.length >= RATE_LIMIT_MESSAGES) {
      const oldestMessage = Math.min(...recentMessages);
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestMessage)) / 1000);
      setRateLimitWarning(`Rate limit reached. Wait ${waitTime}s`);
      return false;
    }

    // Update warning if close to limit
    if (recentMessages.length >= RATE_LIMIT_MESSAGES - 2) {
      setRateLimitWarning(`${RATE_LIMIT_MESSAGES - recentMessages.length} messages left this minute`);
    } else {
      setRateLimitWarning(null);
    }

    return true;
  }, [messageTimes]);

  // Clear old message times periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessageTimes((prev) => prev.filter((time) => now - time < RATE_LIMIT_WINDOW_MS));
      // Re-check rate limit to update warning
      checkRateLimit();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkRateLimit]);

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: (roomId: string) => chatApi.joinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    },
    onError: (error) => {
      addNotification({
        type: 'system_alert',
        urgency: 'important',
        title: 'Chat Error',
        message: `Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  const joinRoom = (roomId: string) => {
    joinRoomMutation.mutate(roomId);
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { room_id: string; content: string }) =>
      chatApi.sendMessage(data),
    onSuccess: (message) => {
      // Record message time for rate limiting
      setMessageTimes((prev) => [...prev, Date.now()]);

      // Optimistically add message (will be replaced by SSE event)
      setMessages((prev) => ({
        ...prev,
        [message.room_id]: [...(prev[message.room_id] || []), message],
      }));
      setMessageInput('');

      // Clear any related failed message
      setFailedMessages((prev) =>
        prev.filter((fm) => fm.room_id !== message.room_id || fm.content !== message.content)
      );

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      // Check if it's a rate limit error (429)
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        setRateLimitWarning('Rate limit exceeded. Please wait a moment.');
        addNotification({
          type: 'system_alert',
          urgency: 'important',
          title: 'Rate Limited',
          message: 'You are sending messages too quickly. Please slow down.',
        });
      } else {
        // Add to failed messages for retry
        const failedId = `failed-${Date.now()}`;
        setFailedMessages((prev) => [
          ...prev,
          {
            id: failedId,
            room_id: variables.room_id,
            content: variables.content,
            attempts: 1,
            error: errorMessage,
          },
        ]);

        addNotification({
          type: 'system_alert',
          urgency: 'important',
          title: 'Message Failed',
          message: errorMessage,
        });
      }
    },
  });

  // Retry failed message
  const retryMessage = useCallback(
    async (failedMessage: FailedMessage) => {
      if (failedMessage.attempts >= RETRY_MAX_ATTEMPTS) {
        addNotification({
          type: 'system_alert',
          urgency: 'important',
          title: 'Message Failed',
          message: 'Maximum retry attempts reached. Please try again later.',
        });
        setFailedMessages((prev) => prev.filter((fm) => fm.id !== failedMessage.id));
        return;
      }

      // Update attempt count
      setFailedMessages((prev) =>
        prev.map((fm) =>
          fm.id === failedMessage.id ? { ...fm, attempts: fm.attempts + 1 } : fm
        )
      );

      // Retry after delay
      setTimeout(() => {
        sendMessageMutation.mutate({
          room_id: failedMessage.room_id,
          content: failedMessage.content,
        });
      }, RETRY_DELAY_MS);
    },
    [sendMessageMutation, addNotification]
  );

  // Dismiss failed message
  const dismissFailedMessage = (id: string) => {
    setFailedMessages((prev) => prev.filter((fm) => fm.id !== id));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoomId) return;

    // Check rate limit before sending
    if (!checkRateLimit()) {
      return;
    }

    // Check for profanity and warn (but still send - filter is for display)
    if (containsProfanity(messageInput)) {
      // Just a heads-up, message will still be sent
      // Backend may also filter it
    }

    sendMessageMutation.mutate({
      room_id: selectedRoomId,
      content: messageInput.trim(),
    });
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);

    // Clear unread count for this room
    setUnreadCounts((prev) => ({
      ...prev,
      [roomId]: 0,
    }));

    // Join room if not already joined
    const room = rooms.find((r) => r.room_id === roomId);
    if (room && !room.is_joined) {
      joinRoom(roomId);
    }
  };

  const selectedRoom = rooms.find((r) => r.room_id === selectedRoomId);
  const currentMessages = selectedRoomId ? messages[selectedRoomId] || [] : [];
  const currentRoomFailedMessages = failedMessages.filter(
    (fm) => fm.room_id === selectedRoomId
  );

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageCircle size={16} color={tokens.colors.primary.main} />
          <Text style={styles.headerTitle}>CHAT</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={styles.settingsButton}
          >
            <Settings size={18} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setProfanityFilter(!profanityFilterEnabled)}
          >
            <Text style={styles.settingLabel}>Profanity Filter</Text>
            <View
              style={[
                styles.toggle,
                profanityFilterEnabled && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  profanityFilterEnabled && styles.toggleKnobActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Rate Limit Warning */}
      {rateLimitWarning && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={14} color={tokens.colors.warning} />
          <Text style={styles.warningText}>{rateLimitWarning}</Text>
        </View>
      )}

      {/* Error Banner */}
      {roomsError && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={14} color={tokens.colors.danger} />
          <Text style={styles.errorText}>Failed to load chat rooms</Text>
        </View>
      )}

      {/* Room Tabs */}
      <View style={styles.roomTabs}>
        {roomsLoading ? (
          <ActivityIndicator size="small" color={tokens.colors.primary.main} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rooms.map((room) => {
              const unreadCount = unreadCounts[room.room_id] || 0;
              const isSelected = room.room_id === selectedRoomId;

              return (
                <TouchableOpacity
                  key={room.room_id}
                  style={[styles.roomTab, isSelected && styles.roomTabActive]}
                  onPress={() => handleSelectRoom(room.room_id)}
                >
                  <Text style={[styles.roomTabText, isSelected && styles.roomTabTextActive]}>
                    {room.room_type === 'sector' ? 'Sector' :
                     room.room_type === 'faction' ? 'Faction' :
                     room.room_type === 'global' ? 'Global' :
                     room.room_type === 'dm' ? 'DM' : room.name}
                  </Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
        >
          {currentMessages.length === 0 && currentRoomFailedMessages.length === 0 && (
            <View style={styles.emptyState}>
              <MessageCircle size={32} color={tokens.colors.text.tertiary} />
              <Text style={styles.emptyStateText}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          )}

          {currentMessages.map((message) => {
            const isOwnMessage = message.sender_id === playerId;
            const isSystemMessage = message.is_system_message;

            // Apply profanity filter to displayed content
            const displayContent = getDisplayText(message.content, profanityFilterEnabled);

            if (isSystemMessage) {
              return (
                <View key={message.message_id} style={styles.systemMessage}>
                  <Text style={styles.systemMessageText}>{displayContent}</Text>
                </View>
              );
            }

            return (
              <View
                key={message.message_id}
                style={[styles.message, isOwnMessage && styles.ownMessage]}
              >
                {!isOwnMessage && (
                  <Text style={styles.senderName}>{message.sender_name}</Text>
                )}
                <Text style={styles.messageContent}>{displayContent}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}

          {/* Failed Messages */}
          {currentRoomFailedMessages.map((fm) => (
            <View key={fm.id} style={styles.failedMessage}>
              <View style={styles.failedMessageContent}>
                <AlertTriangle size={14} color={tokens.colors.danger} />
                <Text style={styles.failedMessageText} numberOfLines={2}>
                  {fm.content}
                </Text>
              </View>
              <Text style={styles.failedMessageError}>{fm.error}</Text>
              <View style={styles.failedMessageActions}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => retryMessage(fm)}
                  disabled={fm.attempts >= RETRY_MAX_ATTEMPTS}
                >
                  <RefreshCw size={14} color={tokens.colors.primary.main} />
                  <Text style={styles.retryButtonText}>
                    Retry ({fm.attempts}/{RETRY_MAX_ATTEMPTS})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => dismissFailedMessage(fm.id)}
                >
                  <X size={14} color={tokens.colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageInput}
            onChangeText={setMessageInput}
            placeholder="Type message..."
            placeholderTextColor={tokens.colors.text.tertiary}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
            editable={!rateLimitWarning?.includes('Rate limit reached')}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageInput.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color={tokens.colors.text.primary} />
            ) : (
              <Send size={20} color={tokens.colors.text.primary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.surface.base,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  headerTitle: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  settingsButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsPanel: {
    backgroundColor: tokens.colors.surface.raised,
    padding: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
  },

  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.text.disabled,
    padding: 2,
  },

  toggleActive: {
    backgroundColor: tokens.colors.primary.main,
  },

  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.colors.text.primary,
  },

  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: `${tokens.colors.warning}20`,
    padding: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.warning,
  },

  warningText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.warning,
    flex: 1,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: `${tokens.colors.danger}20`,
    padding: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.danger,
  },

  errorText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.danger,
    flex: 1,
  },

  roomTabs: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[2],
    minHeight: 48,
    justifyContent: 'center',
  },

  roomTab: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    marginHorizontal: tokens.spacing[1],
    borderRadius: tokens.radius.base,
    position: 'relative',
  },

  roomTabActive: {
    backgroundColor: tokens.colors.primary.alpha[20],
  },

  roomTabText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  roomTabTextActive: {
    color: tokens.colors.primary.main,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: tokens.colors.danger,
    borderRadius: tokens.radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[1],
  },

  unreadBadgeText: {
    fontSize: 8,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  content: {
    flex: 1,
  },

  messagesScroll: {
    flex: 1,
  },

  messagesContent: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[3],
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[12],
    gap: tokens.spacing[3],
  },

  emptyStateText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
  },

  message: {
    backgroundColor: tokens.colors.surface.raised,
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },

  ownMessage: {
    backgroundColor: tokens.colors.primary.alpha[20],
    alignSelf: 'flex-end',
  },

  senderName: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.primary.main,
    fontWeight: tokens.typography.fontWeight.semibold,
    marginBottom: tokens.spacing[1],
  },

  messageContent: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
    lineHeight: tokens.typography.lineHeight.normal * tokens.typography.fontSize.sm,
  },

  messageTime: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[1],
    fontFamily: tokens.typography.fontFamily.mono,
  },

  systemMessage: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
  },

  systemMessageText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
  },

  failedMessage: {
    backgroundColor: `${tokens.colors.danger}10`,
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.danger,
    maxWidth: '80%',
    alignSelf: 'flex-end',
  },

  failedMessageContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing[2],
  },

  failedMessageText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    flex: 1,
  },

  failedMessageError: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.danger,
    marginTop: tokens.spacing[2],
  },

  failedMessageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing[2],
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    padding: tokens.spacing[2],
  },

  retryButtonText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.primary.main,
  },

  dismissButton: {
    padding: tokens.spacing[2],
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    gap: tokens.spacing[2],
  },

  input: {
    flex: 1,
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
    maxHeight: 100,
  },

  sendButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary.main,
    borderRadius: tokens.radius.base,
  },

  sendButtonDisabled: {
    backgroundColor: tokens.colors.text.disabled,
  },
});
