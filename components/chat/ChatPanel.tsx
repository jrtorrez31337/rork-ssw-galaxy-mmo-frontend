import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, X, MessageCircle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { chatApi } from '@/api/chat';
import { useChatEvents } from '@/hooks/useChatEvents';
import { ChatRoom, ChatMessage, ChatEvent } from '@/types/chat';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatPanelProps {
  playerId: string;
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
 */
export function ChatPanel({ playerId, currentSector, isVisible, onClose }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Fetch available rooms
  const { data: roomsData } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: chatApi.getRooms,
    enabled: isVisible,
  });

  const rooms = roomsData?.rooms || [];

  // Get current sector room
  const sectorRoom = rooms.find(
    (r) => r.room_type === 'sector' && r.name.includes(currentSector || '')
  );

  // Auto-select sector room if available
  useEffect(() => {
    if (sectorRoom && !selectedRoomId) {
      setSelectedRoomId(sectorRoom.room_id);
      // Auto-join sector room
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

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: (roomId: string) => chatApi.joinRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
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
      // Optimistically add message (will be replaced by SSE event)
      setMessages((prev) => ({
        ...prev,
        [message.room_id]: [...(prev[message.room_id] || []), message],
      }));
      setMessageInput('');

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoomId) return;

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
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={20} color={tokens.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Room Tabs */}
      <View style={styles.roomTabs}>
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
          {currentMessages.length === 0 && (
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

            if (isSystemMessage) {
              return (
                <View key={message.message_id} style={styles.systemMessage}>
                  <Text style={styles.systemMessageText}>{message.content}</Text>
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
                <Text style={styles.messageContent}>{message.content}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}
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
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageInput.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || sendMessageMutation.isPending}
          >
            <Send size={20} color={tokens.colors.text.primary} />
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

  headerTitle: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roomTabs: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[2],
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
