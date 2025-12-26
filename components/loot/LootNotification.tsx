import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Gift, Coins, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLootStore } from '@/stores/lootStore';
import QualityIndicator from '@/components/mining/QualityIndicator';

/**
 * Loot notification modal shown when loot is received from combat
 * Displays credits and resources with quality values
 */
export default function LootNotification() {
  const { recentLoot, showNotification, dismissNotification } = useLootStore();

  if (!showNotification || !recentLoot) {
    return null;
  }

  const hasCredits = recentLoot.credits > 0;
  const hasResources = recentLoot.resources.length > 0;

  return (
    <Modal
      visible={showNotification}
      transparent={true}
      animationType="slide"
      onRequestClose={dismissNotification}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Gift size={32} color={Colors.success} />
            <Text style={styles.title}>Loot Received!</Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Credits */}
            {hasCredits && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Coins size={20} color={Colors.warning} />
                  <Text style={styles.sectionTitle}>Credits</Text>
                </View>
                <View style={styles.creditsBox}>
                  <Text style={styles.creditsAmount}>
                    +{recentLoot.credits.toLocaleString()}
                  </Text>
                  <Text style={styles.creditsLabel}>CREDITS</Text>
                </View>
              </View>
            )}

            {/* Resources */}
            {hasResources && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Package size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Resources</Text>
                </View>
                <View style={styles.resourcesList}>
                  {recentLoot.resources.map((resource, index) => (
                    <View key={index} style={styles.resourceItem}>
                      <View style={styles.resourceInfo}>
                        <Text style={styles.resourceType}>
                          {resource.resource_type.replace('_', ' ')}
                        </Text>
                        <Text style={styles.resourceQuantity}>
                          x{resource.quantity}
                        </Text>
                      </View>
                      <QualityIndicator
                        quality={parseFloat(resource.quality)}
                        showLabel={true}
                        size="small"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty state */}
            {!hasCredits && !hasResources && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No loot dropped</Text>
              </View>
            )}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            style={styles.button}
            onPress={dismissNotification}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 2,
    borderColor: Colors.success,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
  },
  contentScroll: {
    maxHeight: 400,
  },
  content: {
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  creditsBox: {
    backgroundColor: Colors.warning + '20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.warning,
    fontFamily: 'monospace',
  },
  creditsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    letterSpacing: 1,
  },
  resourcesList: {
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resourceInfo: {
    flex: 1,
    gap: 4,
  },
  resourceType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  resourceQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
