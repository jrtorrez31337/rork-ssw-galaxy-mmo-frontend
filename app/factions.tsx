import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flag } from 'lucide-react-native';
import { Text } from '@/ui';
import { tokens } from '@/ui/theme';
import FactionsList from '@/components/factions/FactionsList';
import FactionDetailsPanel from '@/components/factions/FactionDetailsPanel';
import type { Faction } from '@/types/factions';

export default function FactionsScreen() {
  const router = useRouter();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleFactionPress = (faction: Faction) => {
    setSelectedFaction(faction);
    setDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    // Delay clearing faction to allow animation to complete
    setTimeout(() => setSelectedFaction(null), 200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <ArrowLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Flag size={24} color={tokens.colors.primary.main} />
          <Text variant="title" weight="bold">
            Galactic Factions
          </Text>
        </View>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitle}>
        <Text variant="body" color={tokens.colors.text.secondary}>
          View faction standings, diplomatic relations, and territory control across the galaxy.
        </Text>
      </View>

      {/* Factions List */}
      <View style={styles.listContainer}>
        <FactionsList onFactionPress={handleFactionPress} />
      </View>

      {/* Faction Details Panel */}
      <FactionDetailsPanel
        faction={selectedFaction}
        visible={detailsVisible}
        onClose={handleCloseDetails}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    backgroundColor: tokens.colors.surface.base,
  } as ViewStyle,

  backButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing[2],
  } as ViewStyle,

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  } as ViewStyle,

  subtitle: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.overlay,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  } as ViewStyle,

  listContainer: {
    flex: 1,
  } as ViewStyle,
});
