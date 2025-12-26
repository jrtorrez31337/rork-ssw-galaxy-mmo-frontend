import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import { Store, ChevronDown } from 'lucide-react-native';
import { useTradingStore } from '@/stores/tradingStore';
import { COMMODITIES } from '@/types/economy';
import Colors from '@/constants/colors';

interface MarketSelectorProps {
  marketId: string | null;
  marketName?: string;
  onMarketChange?: (marketId: string) => void;
}

export default function MarketSelector({
  marketId,
  marketName = 'Unknown Market',
  onMarketChange,
}: MarketSelectorProps) {
  const { selectedCommodity, setSelectedCommodity } = useTradingStore();
  const [commodityModalVisible, setCommodityModalVisible] = useState(false);

  const formatCommodityName = (commodity: string) => {
    return commodity
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      {/* Market Display */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Store size={20} color={Colors.primary} />
          <Text style={styles.sectionLabel}>Market</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoValue}>{marketName}</Text>
          {marketId && <Text style={styles.infoSubtext}>ID: {marketId.slice(0, 8)}...</Text>}
        </View>
      </View>

      {/* Commodity Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Commodity</Text>
        </View>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setCommodityModalVisible(true)}
        >
          <Text style={styles.selectButtonText}>
            {selectedCommodity ? formatCommodityName(selectedCommodity) : 'Select Commodity'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Commodity Selection Modal */}
      <Modal
        visible={commodityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCommodityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Commodity</Text>
              <TouchableOpacity
                onPress={() => setCommodityModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commodityList} showsVerticalScrollIndicator={false}>
              {COMMODITIES.map((commodity) => (
                <TouchableOpacity
                  key={commodity}
                  style={[
                    styles.commodityItem,
                    selectedCommodity === commodity && styles.commodityItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCommodity(commodity);
                    setCommodityModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.commodityItemText,
                      selectedCommodity === commodity && styles.commodityItemTextSelected,
                    ]}
                  >
                    {formatCommodityName(commodity)}
                  </Text>
                  {selectedCommodity === commodity && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: Colors.textDim,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  commodityList: {
    flex: 1,
  },
  commodityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commodityItemSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  commodityItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  commodityItemTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  selectedIndicator: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
});
