import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, MapPin, Zap } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import {
  FactionId,
  FACTION_COLORS,
  FACTION_METADATA,
  PLAYABLE_FACTIONS,
} from '@/types/factions';

interface FactionSelectionStepProps {
  selectedFaction: FactionId | null;
  onSelect: (factionId: FactionId) => void;
}

// Faction display names for UI
const FACTION_NAMES: Record<Exclude<FactionId, 'neutral'>, string> = {
  terran_federation: 'Terran Federation',
  stellar_imperium: 'Stellar Imperium',
  void_consortium: 'Void Consortium',
  free_traders: 'Free Traders League',
  shadow_syndicate: 'Shadow Syndicate',
  tech_collective: 'Tech Collective',
  outer_rim_alliance: 'Outer Rim Alliance',
  merchant_guild: 'Merchant Guild',
  pirate_clans: 'Pirate Clans',
};

export default function FactionSelectionStep({
  selectedFaction,
  onSelect,
}: FactionSelectionStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Faction</Text>
      <Text style={styles.subtitle}>
        Your faction determines your starting location and respawn points
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PLAYABLE_FACTIONS.map((factionId) => {
          const metadata = FACTION_METADATA[factionId];
          const color = FACTION_COLORS[factionId];
          const isSelected = selectedFaction === factionId;
          const name = FACTION_NAMES[factionId];

          return (
            <TouchableOpacity
              key={factionId}
              style={[
                styles.factionCard,
                { borderLeftColor: color },
                isSelected && styles.factionCardSelected,
                isSelected && { borderColor: color },
              ]}
              onPress={() => onSelect(factionId)}
              activeOpacity={0.7}
            >
              {/* Selection indicator */}
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: color }]}>
                  <Check size={14} color={tokens.colors.background.primary} />
                </View>
              )}

              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.emblem, { backgroundColor: color + '30' }]}>
                  <Text style={[styles.emblemText, { color }]}>
                    {name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.factionName}>{name}</Text>
                  <Text style={[styles.archetype, { color }]}>
                    {metadata.archetype}
                  </Text>
                </View>
              </View>

              {/* Tagline */}
              <Text style={styles.tagline}>"{metadata.tagline}"</Text>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {metadata.description}
              </Text>

              {/* Capital & Benefits */}
              <View style={styles.infoRow}>
                <View style={styles.capitalInfo}>
                  <MapPin size={12} color={tokens.colors.text.tertiary} />
                  <Text style={styles.capitalText}>
                    Capital: {metadata.capitalSector}
                  </Text>
                </View>
              </View>

              {/* Starting Benefits */}
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsLabel}>Starting Benefits:</Text>
                {metadata.startingBenefits.slice(0, 2).map((benefit, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <Zap size={10} color={color} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[2],
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[4],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: tokens.spacing[3],
    paddingBottom: tokens.spacing[4],
  },
  factionCard: {
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[2],
    position: 'relative',
  },
  factionCardSelected: {
    borderWidth: 2,
    backgroundColor: tokens.colors.surface.base,
  },
  selectedBadge: {
    position: 'absolute',
    top: tokens.spacing[3],
    right: tokens.spacing[3],
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemText: {
    fontSize: 22,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  headerInfo: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  factionName: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  archetype: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: tokens.typography.fontSize.sm,
    fontStyle: 'italic',
    color: tokens.colors.text.tertiary,
  },
  description: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  capitalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  capitalText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  benefitsContainer: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    paddingTop: tokens.spacing[2],
    marginTop: tokens.spacing[1],
    gap: tokens.spacing[1],
  },
  benefitsLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[1],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  benefitText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
});
