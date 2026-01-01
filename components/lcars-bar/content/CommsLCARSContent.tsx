import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Radio, MessageSquare, Users, AlertTriangle, Mail, Send } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { SwipeableLCARSContainer } from '../SwipeableLCARSContainer';

/**
 * CommsLCARSContent - Communications controls for the unified LCARS bar
 *
 * Pages: Channels | Messages | Hail & Actions
 */

function ChannelsPage() {
  // TODO: Connect to communications state
  const channels = [
    { id: 'local', name: 'LOCAL', unread: 0, description: 'Sector chat' },
    { id: 'faction', name: 'FACTION', unread: 2, description: 'Alliance comms' },
    { id: 'trade', name: 'TRADE', unread: 0, description: 'Market talk' },
    { id: 'help', name: 'HELP', unread: 1, description: 'New player help' },
  ];
  const activeChannel = 'local';

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>CHANNELS</Text>

      <View style={styles.channelGrid}>
        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={[
              styles.channelButton,
              activeChannel === channel.id && styles.channelButtonActive,
            ]}
          >
            <View style={styles.channelHeader}>
              <Text style={[
                styles.channelName,
                activeChannel === channel.id && styles.channelNameActive,
              ]}>
                {channel.name}
              </Text>
              {channel.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{channel.unread}</Text>
                </View>
              )}
            </View>
            <Text style={styles.channelDesc}>{channel.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MessagesPage() {
  // TODO: Connect to messages state
  const messages = [
    { sender: 'Station Control', preview: 'Docking permission granted...', time: '2m', isSystem: true },
    { sender: 'Trader_Mike', preview: 'Got any fuel cells?', time: '5m', isSystem: false },
    { sender: 'FACTION', preview: 'Rally at Alpha-7...', time: '12m', isSystem: false },
  ];

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>RECENT MESSAGES</Text>

      <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
        {messages.map((msg, index) => (
          <TouchableOpacity key={index} style={styles.messageItem}>
            <View style={styles.messageHeader}>
              <Text style={[
                styles.messageSender,
                msg.isSystem && styles.messageSenderSystem,
              ]}>
                {msg.sender}
              </Text>
              <Text style={styles.messageTime}>{msg.time}</Text>
            </View>
            <Text style={styles.messagePreview} numberOfLines={1}>
              {msg.preview}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.composeButton}>
        <Send size={14} color={tokens.colors.semantic.communications} />
        <Text style={styles.composeButtonText}>COMPOSE</Text>
      </TouchableOpacity>
    </View>
  );
}

function HailActionsPage() {
  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>HAIL & ACTIONS</Text>

      <View style={styles.hailSection}>
        <TouchableOpacity style={styles.hailButton}>
          <Radio size={32} color={tokens.colors.semantic.communications} />
          <Text style={styles.hailButtonText}>OPEN HAIL</Text>
          <Text style={styles.hailButtonHint}>Contact nearby ships</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <MessageSquare size={22} color={tokens.colors.semantic.communications} />
          <Text style={styles.actionButtonText}>DIRECT MSG</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Users size={22} color={tokens.colors.semantic.communications} />
          <Text style={styles.actionButtonText}>CREW CHAT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Mail size={22} color={tokens.colors.semantic.communications} />
          <Text style={styles.actionButtonText}>INBOX</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.distressButton}>
        <AlertTriangle size={18} color={tokens.colors.alert.red} />
        <Text style={styles.distressText}>DISTRESS SIGNAL (SOS)</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CommsLCARSContent() {
  const pages = [
    <ChannelsPage key="channels" />,
    <MessagesPage key="messages" />,
    <HailActionsPage key="hail-actions" />,
  ];

  return (
    <SwipeableLCARSContainer
      pages={pages}
      activeColor={tokens.colors.semantic.communications}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  pageTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
    letterSpacing: 2,
    marginBottom: 4,
  },
  // Channels Page
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  channelButton: {
    width: 120,
    padding: 10,
    borderRadius: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  channelButtonActive: {
    backgroundColor: tokens.colors.semantic.communications + '20',
    borderColor: tokens.colors.semantic.communications,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  channelNameActive: {
    color: tokens.colors.semantic.communications,
  },
  unreadBadge: {
    backgroundColor: tokens.colors.semantic.communications,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.inverse,
  },
  channelDesc: {
    fontSize: 8,
    color: tokens.colors.text.muted,
  },
  // Messages Page
  messagesList: {
    width: '90%',
    maxHeight: 120,
  },
  messageItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: tokens.colors.semantic.communications,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageSender: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
  },
  messageSenderSystem: {
    color: tokens.colors.command.gold,
  },
  messageTime: {
    fontSize: 8,
    color: tokens.colors.text.muted,
  },
  messagePreview: {
    fontSize: 9,
    color: tokens.colors.text.secondary,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.communications,
  },
  composeButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
    letterSpacing: 1,
  },
  // Hail & Actions Page
  hailSection: {
    marginBottom: 8,
  },
  hailButton: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.colors.semantic.communications,
  },
  hailButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
    letterSpacing: 1,
  },
  hailButtonHint: {
    fontSize: 9,
    color: tokens.colors.text.muted,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    minWidth: 70,
  },
  actionButtonText: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  distressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: tokens.colors.alert.red + '20',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.alert.red,
  },
  distressText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.alert.red,
    letterSpacing: 1,
  },
});
