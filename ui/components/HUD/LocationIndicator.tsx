import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Text } from '../Text';
import { Badge } from '../Badge';
import { tokens } from '../../theme';

interface LocationIndicatorProps {
  sector: string;
  stationName?: string;
  onPress?: () => void;
}

export function LocationIndicator({ sector, stationName, onPress }: LocationIndicatorProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress} accessible={!!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <MapPin size={tokens.interaction.iconSize.sm} color={tokens.colors.primary.main} />
      <View style={styles.info}>
        <Text variant="caption" weight="semibold">
          {sector}
        </Text>
        {stationName && (
          <View style={styles.station}>
            <Badge dot variant="info" />
            <Text variant="caption" color={tokens.colors.text.tertiary} style={styles.stationText}>
              {stationName}
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  info: {
    gap: tokens.spacing[1],
  },
  station: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  stationText: {
    fontSize: tokens.typography.fontSize.xs,
  },
});
