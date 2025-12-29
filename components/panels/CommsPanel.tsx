import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Radio, Users, MessageSquare, Flag, Send } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Panel, StatusChip, RailButton } from '@/ui/components';
import { useAuth } from '@/contexts/AuthContext';

/**
 * CommsPanel - COM Rail Content
 *
 * Per UI/UX Doctrine:
 * - Chat channels
 * - Faction standings
 * - Message history
 * - Hailing system
 */

type CommsMode = 'chat' | 'factions' | 'hail';

export function CommsPanel() {
  const [mode, setMode] = useState<CommsMode>('chat');
  const [message, setMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('local');
  const { profileId } = useAuth();

  const channels = [
    { id: 'local', name: 'Local', unread: 0 },
    { id: 'faction', name: 'Faction', unread: 3 },
    { id: 'trade', name: 'Trade', unread: 0 },
    { id: 'help', name: 'Help', unread: 1 },
  ];

  // Mock messages for display
  const messages = [
    { id: '1', sender: 'Commander Rex', text: 'Anyone seen pirates near sector 7?', time: '2m ago', isOwn: false },
    { id: '2', sender: 'You', text: 'All clear on my end', time: '1m ago', isOwn: true },
    { id: '3', sender: 'Trader_42', text: 'Good prices on fuel at Nexus Station', time: '30s ago', isOwn: false },
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log('[COM] Send message:', message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'chat' && styles.modeTabActive]}
          onPress={() => setMode('chat')}
        >
          <MessageSquare size={16} color={mode === 'chat' ? tokens.colors.semantic.communications : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'chat' && styles.modeTabTextActive]}>
            CHAT
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'factions' && styles.modeTabActive]}
          onPress={() => setMode('factions')}
        >
          <Flag size={16} color={mode === 'factions' ? tokens.colors.semantic.communications : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'factions' && styles.modeTabTextActive]}>
            FACTIONS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'hail' && styles.modeTabActive]}
          onPress={() => setMode('hail')}
        >
          <Radio size={16} color={mode === 'hail' ? tokens.colors.semantic.communications : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'hail' && styles.modeTabTextActive]}>
            HAIL
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'chat' && (
        <View style={styles.chatContainer}>
          {/* Channel Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelScroll}>
            <View style={styles.channels}>
              {channels.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  style={[
                    styles.channelButton,
                    activeChannel === channel.id && styles.channelButtonActive,
                  ]}
                  onPress={() => setActiveChannel(channel.id)}
                >
                  <Text
                    style={[
                      styles.channelText,
                      activeChannel === channel.id && styles.channelTextActive,
                    ]}
                  >
                    {channel.name}
                  </Text>
                  {channel.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{channel.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Messages */}
          <ScrollView style={styles.messageList} showsVerticalScrollIndicator={false}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.message, msg.isOwn && styles.messageOwn]}
              >
                <Text style={[styles.messageSender, msg.isOwn && styles.messageSenderOwn]}>
                  {msg.sender}
                </Text>
                <Text style={styles.messageText}>{msg.text}</Text>
                <Text style={styles.messageTime}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type message..."
              placeholderTextColor={tokens.colors.text.disabled}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Send size={20} color={message.trim() ? tokens.colors.semantic.communications : tokens.colors.text.disabled} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mode === 'factions' && (
        <ScrollView style={styles.factionsContainer} showsVerticalScrollIndicator={false}>
          <Panel variant="communications" title="FACTION STANDINGS" style={styles.panel}>
            <FactionRow name="Federation" standing={75} status="Friendly" />
            <FactionRow name="Free Traders Guild" standing={50} status="Neutral" />
            <FactionRow name="Outer Rim Alliance" standing={25} status="Wary" />
            <FactionRow name="Crimson Syndicate" standing={-30} status="Hostile" />
          </Panel>

          <Panel variant="communications" title="RECENT CHANGES" style={styles.panel}>
            <Text style={styles.placeholderText}>
              Faction reputation changes will appear here.
            </Text>
          </Panel>
        </ScrollView>
      )}

      {mode === 'hail' && (
        <ScrollView style={styles.hailContainer} showsVerticalScrollIndicator={false}>
          <Panel variant="communications" title="HAILING FREQUENCIES" style={styles.panel}>
            <Text style={styles.hailInfo}>
              Select a target from the sector view to open a communication channel.
            </Text>
            <RailButton
              label="BROADCAST DISTRESS"
              variant="combat"
              onPress={() => console.log('[COM] Distress broadcast')}
            />
            <Text style={styles.hailWarning}>
              Warning: Distress signals reveal your position to all ships in range.
            </Text>
          </Panel>

          <Panel variant="communications" title="RECENT HAILS" style={styles.panel}>
            <Text style={styles.placeholderText}>No recent communications.</Text>
          </Panel>
        </ScrollView>
      )}
    </View>
  );
}

function FactionRow({
  name,
  standing,
  status,
}: {
  name: string;
  standing: number;
  status: string;
}) {
  const getStatusColor = () => {
    if (standing >= 50) return 'online';
    if (standing >= 0) return 'neutral';
    if (standing >= -50) return 'warning';
    return 'danger';
  };

  return (
    <View style={styles.factionRow}>
      <View style={styles.factionInfo}>
        <Text style={styles.factionName}>{name}</Text>
        <StatusChip label="" value={status} status={getStatusColor()} size="small" />
      </View>
      <View style={styles.factionStanding}>
        <View style={styles.standingBar}>
          <View
            style={[
              styles.standingFill,
              {
                width: `${Math.abs(standing)}%`,
                backgroundColor:
                  standing >= 0
                    ? tokens.colors.semantic.success
                    : tokens.colors.semantic.danger,
                alignSelf: standing >= 0 ? 'flex-end' : 'flex-start',
              },
            ]}
          />
          <View style={styles.standingCenter} />
        </View>
        <Text style={styles.standingValue}>{standing > 0 ? '+' : ''}{standing}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    marginBottom: tokens.spacing[3],
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: tokens.spacing[3],
    gap: tokens.spacing[2],
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[1],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.sm,
  },
  modeTabActive: {
    backgroundColor: tokens.colors.semantic.communications,
  },
  modeTabText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  modeTabTextActive: {
    color: tokens.colors.text.inverse,
  },
  chatContainer: {
    flex: 1,
  },
  channelScroll: {
    maxHeight: 40,
    marginBottom: tokens.spacing[2],
  },
  channels: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
  },
  channelButtonActive: {
    backgroundColor: tokens.colors.semantic.communications,
  },
  channelText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  channelTextActive: {
    color: tokens.colors.text.inverse,
  },
  unreadBadge: {
    marginLeft: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[1],
    paddingVertical: 1,
    backgroundColor: tokens.colors.semantic.danger,
    borderRadius: tokens.radius.full,
    minWidth: 16,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 9,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
  },
  messageList: {
    flex: 1,
    marginBottom: tokens.spacing[2],
  },
  message: {
    padding: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.semantic.communications,
  },
  messageOwn: {
    borderLeftColor: tokens.colors.lcars.peach,
    backgroundColor: `${tokens.colors.lcars.peach}15`,
  },
  messageSender: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.communications,
    marginBottom: 2,
  },
  messageSenderOwn: {
    color: tokens.colors.lcars.peach,
  },
  messageText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  messageTime: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.disabled,
    marginTop: tokens.spacing[1],
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingTop: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: tokens.spacing[3],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.fontSize.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  factionsContainer: {
    flex: 1,
  },
  factionRow: {
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  factionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
  },
  factionName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  factionStanding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  standingBar: {
    flex: 1,
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  standingFill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  standingCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: tokens.colors.border.light,
  },
  standingValue: {
    width: 40,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
    textAlign: 'right',
    fontFamily: tokens.typography.fontFamily.mono,
  },
  hailContainer: {
    flex: 1,
  },
  hailInfo: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[3],
  },
  hailWarning: {
    marginTop: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.semantic.warning,
    fontStyle: 'italic',
  },
  placeholderText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: tokens.spacing[4],
  },
});
