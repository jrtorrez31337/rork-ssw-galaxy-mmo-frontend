import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { characterApi } from '@/api/characters';
import { Ship, Anchor, User, Shield, Heart, Fuel, MapPin } from 'lucide-react-native';
import type { Ship as ShipType, Character } from '@/types/api';

/**
 * FleetLCARSContent - Fleet management panel
 *
 * Shows ships and characters associated with the account:
 * - List of owned ships with quick stats
 * - Character info with faction
 */

function ShipCard({ ship, isActive }: { ship: ShipType; isActive: boolean }) {
  const hullPct = Math.round((ship.hull_points / ship.hull_max) * 100);
  const shieldPct = Math.round((ship.shield_points / ship.shield_max) * 100);
  const fuelPct = Math.round((ship.fuel_current / ship.fuel_capacity) * 100);

  const getStatusColor = (pct: number) => {
    if (pct < 25) return tokens.colors.alert.critical;
    if (pct < 50) return tokens.colors.alert.warning;
    return tokens.colors.status.online;
  };

  return (
    <View style={[styles.shipCard, isActive && styles.shipCardActive]}>
      <View style={styles.shipHeader}>
        <Ship size={14} color={isActive ? tokens.colors.command.gold : tokens.colors.text.secondary} />
        <Text style={[styles.shipName, isActive && styles.shipNameActive]} numberOfLines={1}>
          {ship.name || ship.ship_type.toUpperCase()}
        </Text>
        {isActive && <Text style={styles.activeTag}>ACTIVE</Text>}
      </View>

      <View style={styles.shipType}>
        <Text style={styles.shipTypeText}>{ship.ship_type.toUpperCase()}</Text>
        {ship.docked_at && (
          <View style={styles.dockedBadge}>
            <Anchor size={8} color={tokens.colors.semantic.economy} />
            <Text style={styles.dockedText}>DOCKED</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Heart size={10} color={getStatusColor(hullPct)} />
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${hullPct}%`, backgroundColor: getStatusColor(hullPct) }]} />
          </View>
          <Text style={[styles.statValue, { color: getStatusColor(hullPct) }]}>{hullPct}</Text>
        </View>

        <View style={styles.statItem}>
          <Shield size={10} color={tokens.colors.command.blue} />
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${shieldPct}%`, backgroundColor: tokens.colors.command.blue }]} />
          </View>
          <Text style={[styles.statValue, { color: tokens.colors.command.blue }]}>{shieldPct}</Text>
        </View>

        <View style={styles.statItem}>
          <Fuel size={10} color={tokens.colors.operations.orange} />
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${fuelPct}%`, backgroundColor: tokens.colors.operations.orange }]} />
          </View>
          <Text style={[styles.statValue, { color: tokens.colors.operations.orange }]}>{fuelPct}</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <MapPin size={9} color={tokens.colors.text.muted} />
        <Text style={styles.locationText}>{ship.location_sector}</Text>
      </View>
    </View>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <View style={styles.characterCard}>
      <View style={styles.characterHeader}>
        <User size={14} color={tokens.colors.command.gold} />
        <Text style={styles.characterName}>{character.name}</Text>
      </View>
      <View style={styles.characterDetails}>
        <Text style={styles.characterDetail}>HOME: {character.home_sector}</Text>
        {character.faction_id && (
          <Text style={styles.characterDetail}>FACTION: {character.faction_id.substring(0, 8)}</Text>
        )}
      </View>
    </View>
  );
}

export function FleetLCARSContent() {
  const { profileId } = useAuth();

  const { data: ships, isLoading: shipsLoading } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const { data: characters, isLoading: charactersLoading } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId,
  });

  const isLoading = shipsLoading || charactersLoading;

  return (
    <View style={styles.container}>
      {/* Ships Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ship size={12} color={tokens.colors.lcars.sky} />
          <Text style={styles.sectionTitle}>SHIPS</Text>
          <Text style={styles.sectionCount}>{ships?.length || 0}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : ships && ships.length > 0 ? (
            ships.map((ship, index) => (
              <ShipCard key={ship.id} ship={ship} isActive={index === 0} />
            ))
          ) : (
            <Text style={styles.emptyText}>No ships</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* Characters Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={12} color={tokens.colors.command.gold} />
          <Text style={styles.sectionTitle}>CHARACTERS</Text>
          <Text style={styles.sectionCount}>{characters?.length || 0}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : characters && characters.length > 0 ? (
            characters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))
          ) : (
            <Text style={styles.emptyText}>No characters</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.sm,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.text.secondary,
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 9,
    fontWeight: '600',
    color: tokens.colors.text.muted,
    backgroundColor: tokens.colors.console.hull,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scrollArea: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: tokens.colors.border.default,
    marginHorizontal: tokens.spacing.sm,
  },
  loadingText: {
    fontSize: 11,
    color: tokens.colors.text.muted,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 11,
    color: tokens.colors.text.muted,
  },
  // Ship Card
  shipCard: {
    width: 160,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 6,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  shipCardActive: {
    borderColor: tokens.colors.command.gold,
    backgroundColor: tokens.colors.console.deepSpace,
  },
  shipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  shipName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  shipNameActive: {
    color: tokens.colors.command.gold,
  },
  activeTag: {
    fontSize: 7,
    fontWeight: '700',
    color: tokens.colors.console.deepSpace,
    backgroundColor: tokens.colors.command.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  shipType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  shipTypeText: {
    fontSize: 8,
    fontWeight: '600',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  dockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: tokens.colors.semantic.economy + '30',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  dockedText: {
    fontSize: 7,
    fontWeight: '600',
    color: tokens.colors.semantic.economy,
  },
  statsRow: {
    gap: 4,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBar: {
    flex: 1,
    height: 4,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 2,
  },
  statValue: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    width: 20,
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 9,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  // Character Card
  characterCard: {
    width: 140,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 6,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  characterName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.command.gold,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  characterDetails: {
    gap: 2,
  },
  characterDetail: {
    fontSize: 8,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
