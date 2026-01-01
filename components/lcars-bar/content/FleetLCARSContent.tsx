import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { characterApi } from '@/api/characters';
import { Ship, Anchor, User, Shield, Heart, Fuel, MapPin, Home } from 'lucide-react-native';
import type { Ship as ShipType, Character } from '@/types/api';
import { SwipeableLCARSContainer } from '../SwipeableLCARSContainer';

/**
 * FleetLCARSContent - Fleet management panel
 *
 * Pages: Ships | Characters
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
        <Ship size={16} color={isActive ? tokens.colors.command.gold : tokens.colors.text.secondary} />
        <Text style={[styles.shipName, isActive && styles.shipNameActive]} numberOfLines={1}>
          {ship.name || ship.ship_type.toUpperCase()}
        </Text>
        {isActive && <Text style={styles.activeTag}>ACTIVE</Text>}
      </View>

      <View style={styles.shipMeta}>
        <Text style={styles.shipTypeText}>{ship.ship_type.toUpperCase()}</Text>
        {ship.docked_at && (
          <View style={styles.dockedBadge}>
            <Anchor size={10} color={tokens.colors.semantic.economy} />
            <Text style={styles.dockedText}>DOCKED</Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <Heart size={12} color={getStatusColor(hullPct)} />
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${hullPct}%`, backgroundColor: getStatusColor(hullPct) }]} />
          </View>
          <Text style={[styles.statValue, { color: getStatusColor(hullPct) }]}>{hullPct}%</Text>
        </View>

        <View style={styles.statRow}>
          <Shield size={12} color={tokens.colors.command.blue} />
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${shieldPct}%`, backgroundColor: tokens.colors.command.blue }]} />
          </View>
          <Text style={[styles.statValue, { color: tokens.colors.command.blue }]}>{shieldPct}%</Text>
        </View>

        <View style={styles.statRow}>
          <Fuel size={12} color={tokens.colors.operations.orange} />
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${fuelPct}%`, backgroundColor: tokens.colors.operations.orange }]} />
          </View>
          <Text style={[styles.statValue, { color: tokens.colors.operations.orange }]}>{fuelPct}%</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <MapPin size={10} color={tokens.colors.text.muted} />
        <Text style={styles.locationText}>{ship.location_sector}</Text>
      </View>
    </View>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <View style={styles.characterCard}>
      <View style={styles.characterHeader}>
        <User size={20} color={tokens.colors.command.gold} />
        <Text style={styles.characterName}>{character.name}</Text>
      </View>

      <View style={styles.characterDetails}>
        <View style={styles.detailRow}>
          <Home size={12} color={tokens.colors.text.muted} />
          <Text style={styles.detailLabel}>HOME</Text>
          <Text style={styles.detailValue}>{character.home_sector}</Text>
        </View>
        {character.faction_id && (
          <View style={styles.detailRow}>
            <Shield size={12} color={tokens.colors.text.muted} />
            <Text style={styles.detailLabel}>FACTION</Text>
            <Text style={styles.detailValue}>{character.faction_id.substring(0, 8)}...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ShipsPage() {
  const { profileId } = useAuth();

  const { data: ships, isLoading } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Ship size={16} color={tokens.colors.lcars.sky} />
        <Text style={styles.pageTitle}>SHIPS</Text>
        <Text style={styles.pageCount}>{ships?.length || 0}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Loading ships...</Text>
        ) : ships && ships.length > 0 ? (
          ships.map((ship, index) => (
            <ShipCard key={ship.id} ship={ship} isActive={index === 0} />
          ))
        ) : (
          <Text style={styles.emptyText}>No ships owned</Text>
        )}
      </ScrollView>
    </View>
  );
}

function CharactersPage() {
  const { profileId } = useAuth();

  const { data: characters, isLoading } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId,
  });

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <User size={16} color={tokens.colors.command.gold} />
        <Text style={styles.pageTitle}>CHARACTERS</Text>
        <Text style={styles.pageCount}>{characters?.length || 0}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Loading characters...</Text>
        ) : characters && characters.length > 0 ? (
          characters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))
        ) : (
          <Text style={styles.emptyText}>No characters</Text>
        )}
      </ScrollView>
    </View>
  );
}

export function FleetLCARSContent() {
  const pages = [
    <ShipsPage key="ships" />,
    <CharactersPage key="characters" />,
  ];

  return (
    <SwipeableLCARSContainer
      pages={pages}
      activeColor={tokens.colors.lcars.sky}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text.secondary,
    letterSpacing: 2,
  },
  pageCount: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.text.muted,
    backgroundColor: tokens.colors.console.hull,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardsContainer: {
    paddingHorizontal: 8,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: tokens.colors.text.muted,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 12,
    color: tokens.colors.text.muted,
  },
  // Ship Card
  shipCard: {
    width: 180,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 8,
    padding: 12,
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
    gap: 8,
    marginBottom: 6,
  },
  shipName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  shipNameActive: {
    color: tokens.colors.command.gold,
  },
  activeTag: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.console.deepSpace,
    backgroundColor: tokens.colors.command.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  shipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  shipTypeText: {
    fontSize: 9,
    fontWeight: '600',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  dockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.semantic.economy + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dockedText: {
    fontSize: 8,
    fontWeight: '600',
    color: tokens.colors.semantic.economy,
  },
  statsGrid: {
    gap: 6,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBar: {
    flex: 1,
    height: 6,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
  },
  statValue: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    width: 32,
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 10,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  // Character Card
  characterCard: {
    width: 200,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  characterName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.command.gold,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  characterDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
    width: 50,
  },
  detailValue: {
    fontSize: 11,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
