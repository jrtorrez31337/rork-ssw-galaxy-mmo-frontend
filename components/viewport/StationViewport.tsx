import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/ui';
import { tokens } from '@/ui/theme';
import { Building2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * StationViewport - Station interior view when docked
 *
 * Shows station services and information:
 * - Station name and type
 * - Available services (trade, repair, refuel)
 * - Docking bay visualization
 *
 * Services are accessed via OPS LCARS panel.
 */
export function StationViewport() {
  const { profileId } = useAuth();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const dockedAt = currentShip?.docked_at || 'Unknown Station';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Building2 size={64} color={tokens.colors.semantic.economy} />
        <Text variant="heading" weight="bold" style={styles.title}>
          DOCKED
        </Text>
        <Text variant="body" color={tokens.colors.text.primary}>
          {dockedAt}
        </Text>
        <Text variant="caption" color={tokens.colors.text.tertiary} style={styles.hint}>
          Use OPS panel for station services
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  title: {
    color: tokens.colors.semantic.economy,
    marginTop: tokens.spacing[4],
  },
  hint: {
    marginTop: tokens.spacing[6],
  },
});
