import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShipIndicator } from './ShipIndicator';
import { LocationIndicator } from './LocationIndicator';
import { CreditsDisplay } from './CreditsDisplay';
import { QuickActionsMenu } from './QuickActionsMenu';
import { tokens } from '../../theme';
import type { Ship } from '@/types/api';

interface TopBarProps {
  ship: Ship | null;
  location: string;
  dockedAt?: string;
  credits: number;
  onShipPress?: () => void;
  onLocationPress?: () => void;
  onCreditsPress?: () => void;
  quickActions?: Array<{
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    onPress: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
  }>;
}

export function TopBar({
  ship,
  location,
  dockedAt,
  credits,
  onShipPress,
  onLocationPress,
  onCreditsPress,
  quickActions = [],
}: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + tokens.spacing[3],
          height: tokens.layout.topBar.height + insets.top,
        },
      ]}
    >
      <ShipIndicator ship={ship} onPress={onShipPress} />
      <LocationIndicator sector={location} stationName={dockedAt} onPress={onLocationPress} />
      <View style={styles.spacer} />
      <CreditsDisplay credits={credits} onPress={onCreditsPress} />
      {quickActions.length > 0 && <QuickActionsMenu actions={quickActions} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[6],
    paddingBottom: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.overlay,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    zIndex: tokens.zIndex.fixed,
  },
  spacer: {
    flex: 1,
  },
});
