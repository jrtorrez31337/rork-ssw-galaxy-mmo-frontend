import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Radio, MessageSquare, Users, AlertTriangle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';

/**
 * CommsLCARSContent - Communications controls for the unified LCARS bar
 *
 * Layout: [Channel Selector] | [Recent Message] | [Quick Actions] | [Hail]
 */

function ChannelSelectorSection() {
  // TODO: Connect to communications state
  const channels = [
    { id: 'local', name: 'LOCAL', unread: 0 },
    { id: 'faction', name: 'FACTION', unread: 2 },
    { id: 'trade', name: 'TRADE', unread: 0 },
  ];
  const activeChannel = 'local';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>CHANNEL</Text>
      <View style={styles.channelList}>
        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={[
              styles.channelButton,
              activeChannel === channel.id && styles.channelButtonActive,
            ]}
          >
            <Text style={[
              styles.channelText,
              activeChannel === channel.id && styles.channelTextActive,
            ]}>
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
    </View>
  );
}

function RecentMessageSection() {
  // TODO: Connect to messages state
  const recentMessage = {
    sender: 'Station Control',
    preview: 'Docking permission granted...',
    time: '2m ago',
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>RECENT</Text>
      <View style={styles.messagePreview}>
        <Text style={styles.messageSender}>{recentMessage.sender}</Text>
        <Text style={styles.messageText} numberOfLines={1}>
          {recentMessage.preview}
        </Text>
        <Text style={styles.messageTime}>{recentMessage.time}</Text>
      </View>
    </View>
  );
}

function QuickActionsSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>QUICK</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <MessageSquare size={18} color={tokens.colors.semantic.communications} />
          <Text style={styles.actionButtonText}>MSG</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Users size={18} color={tokens.colors.semantic.communications} />
          <Text style={styles.actionButtonText}>CREW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HailSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>HAIL</Text>
      <TouchableOpacity style={styles.hailButton}>
        <Radio size={24} color={tokens.colors.semantic.communications} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.distressButton}>
        <AlertTriangle size={14} color={tokens.colors.alert.red} />
        <Text style={styles.distressText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CommsLCARSContent() {
  return (
    <>
      <View style={styles.sectionContainerWide}>
        <ChannelSelectorSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerFlex}>
        <RecentMessageSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <QuickActionsSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <HailSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainerWide: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainerFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    backgroundColor: tokens.colors.border.default,
    marginVertical: 8,
  },
  section: {
    alignItems: 'center',
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  channelList: {
    gap: 4,
  },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: tokens.colors.background.tertiary,
    minWidth: 80,
  },
  channelButtonActive: {
    backgroundColor: tokens.colors.semantic.communications + '30',
    borderWidth: 1,
    borderColor: tokens.colors.semantic.communications,
  },
  channelText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  channelTextActive: {
    color: tokens.colors.semantic.communications,
  },
  unreadBadge: {
    backgroundColor: tokens.colors.semantic.communications,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  unreadText: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.text.inverse,
  },
  messagePreview: {
    alignItems: 'center',
    maxWidth: 150,
  },
  messageSender: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
  },
  messageText: {
    fontSize: 9,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 8,
    color: tokens.colors.text.muted,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  actionButtonText: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.semantic.communications,
    letterSpacing: 1,
  },
  hailButton: {
    padding: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.communications,
  },
  distressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: 6,
    backgroundColor: tokens.colors.alert.red + '20',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: tokens.colors.alert.red,
  },
  distressText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.alert.red,
    letterSpacing: 1,
  },
});
