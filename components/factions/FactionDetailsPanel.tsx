import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { X, Users, Globe, Shield, Swords, Handshake } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { factionsApi } from '@/api/factions';
import { tokens } from '@/ui/theme';
import type { Faction, FactionRelation } from '@/types/factions';

interface FactionDetailsPanelProps {
  faction: Faction | null;
  visible: boolean;
  onClose: () => void;
}

export default function FactionDetailsPanel({
  faction,
  visible,
  onClose,
}: FactionDetailsPanelProps) {
  const [slideAnim] = useState(new Animated.Value(0));

  // Fetch detailed faction info
  const { data: factionDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['faction', faction?.id],
    queryFn: () => factionsApi.getFaction(faction!.id),
    enabled: !!faction && visible,
  });

  // Fetch faction relations
  const { data: relations, isLoading: loadingRelations } = useQuery({
    queryKey: ['factionRelations', faction?.id],
    queryFn: () => factionsApi.getFactionRelations(faction!.id),
    enabled: !!faction && visible,
  });

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible || !faction) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [700, 0],
  });

  const formatMemberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getRelationStatusColor = (status: FactionRelation['status']): string => {
    switch (status) {
      case 'allied':
        return tokens.colors.success;
      case 'friendly':
        return '#22C55E';
      case 'neutral':
        return tokens.colors.text.secondary;
      case 'unfriendly':
        return tokens.colors.warning;
      case 'hostile':
        return '#F97316';
      case 'at_war':
        return tokens.colors.danger;
      default:
        return tokens.colors.text.tertiary;
    }
  };

  const getRelationIcon = (status: FactionRelation['status']) => {
    switch (status) {
      case 'allied':
        return <Handshake size={16} color={tokens.colors.success} />;
      case 'friendly':
        return <Shield size={16} color="#22C55E" />;
      case 'hostile':
      case 'at_war':
        return <Swords size={16} color={tokens.colors.danger} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderLeftColor: faction.color }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.emblem, { backgroundColor: faction.color + '30' }]}>
              <Text style={[styles.emblemText, { color: faction.color }]}>
                {faction.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{faction.name}</Text>
              <Text style={styles.subtitle}>Home: {faction.home_system}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <X size={24} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.description}>{faction.description}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Users size={20} color={tokens.colors.primary.main} />
                <Text style={styles.statValue}>
                  {formatMemberCount(faction.member_count)}
                </Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>

              {factionDetails && (
                <>
                  <View style={styles.statItem}>
                    <Globe size={20} color={tokens.colors.info} />
                    <Text style={styles.statValue}>
                      {factionDetails.controlled_sectors}
                    </Text>
                    <Text style={styles.statLabel}>Sectors</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Shield size={20} color={tokens.colors.warning} />
                    <Text style={styles.statValue}>
                      {factionDetails.total_influence.toFixed(1)}%
                    </Text>
                    <Text style={styles.statLabel}>Influence</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Diplomatic Relations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diplomatic Relations</Text>
            {loadingRelations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={tokens.colors.primary.main} />
                <Text style={styles.loadingText}>Loading relations...</Text>
              </View>
            ) : relations?.relations && relations.relations.length > 0 ? (
              <View style={styles.relationsList}>
                {relations.relations.map((rel) => (
                  <View key={rel.faction_id} style={styles.relationItem}>
                    <View style={styles.relationInfo}>
                      {getRelationIcon(rel.status)}
                      <Text style={styles.relationName}>{rel.faction_name}</Text>
                    </View>
                    <View style={styles.relationStatus}>
                      <Text
                        style={[
                          styles.relationStatusText,
                          { color: getRelationStatusColor(rel.status) },
                        ]}
                      >
                        {rel.status.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.relationStanding}>
                        {rel.standing > 0 ? '+' : ''}{rel.standing}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noRelations}>
                No diplomatic relations established
              </Text>
            )}
          </View>

          {/* Trade Modifiers */}
          {relations?.relations && relations.relations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trade Effects</Text>
              <View style={styles.tradeList}>
                {relations.relations
                  .filter((rel) => rel.trade_modifier !== 0)
                  .map((rel) => (
                    <View key={rel.faction_id} style={styles.tradeItem}>
                      <Text style={styles.tradeFaction}>{rel.faction_name}</Text>
                      <Text
                        style={[
                          styles.tradeModifier,
                          {
                            color:
                              rel.trade_modifier > 0
                                ? tokens.colors.success
                                : tokens.colors.danger,
                          },
                        ]}
                      >
                        {rel.trade_modifier > 0 ? '+' : ''}{rel.trade_modifier}% prices
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    maxHeight: '85%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    borderLeftWidth: 4,
    borderTopLeftRadius: tokens.radius.lg,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    flex: 1,
  },

  emblem: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emblemText: {
    fontSize: 24,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  headerInfo: {
    flex: 1,
    gap: tokens.spacing[1],
  },

  title: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  subtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingBottom: tokens.spacing[6],
  },

  section: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  sectionTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  description: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
    lineHeight: 24,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: tokens.spacing[4],
  },

  statItem: {
    alignItems: 'center',
    gap: tokens.spacing[2],
    flex: 1,
    backgroundColor: tokens.colors.surface.overlay,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
  },

  statValue: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[4],
  },

  loadingText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },

  relationsList: {
    gap: tokens.spacing[2],
  },

  relationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface.overlay,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
  },

  relationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  relationName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },

  relationStatus: {
    alignItems: 'flex-end',
    gap: tokens.spacing[1],
  },

  relationStatusText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  relationStanding: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  noRelations: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: tokens.spacing[4],
  },

  tradeList: {
    gap: tokens.spacing[2],
  },

  tradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.overlay,
    borderRadius: tokens.radius.sm,
  },

  tradeFaction: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },

  tradeModifier: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
