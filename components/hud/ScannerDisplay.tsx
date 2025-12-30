/**
 * ScannerDisplay - HUD component showing scan contacts and sensor information
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useScanEvents, type ScanContact } from '@/hooks/useScanEvents';
import { passiveScan, activeScan, getClassificationColor } from '@/api/scan';

interface ScannerDisplayProps {
  shipId: string;
  sensorRange?: number;
  compact?: boolean;
  onContactSelect?: (contact: ScanContact) => void;
}

export function ScannerDisplay({
  shipId,
  sensorRange = 8000,
  compact = false,
  onContactSelect,
}: ScannerDisplayProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    contactsList,
    hostileContacts,
    updateFromScan,
  } = useScanEvents({ shipId });

  const handleScan = useCallback(async (type: 'passive' | 'active') => {
    if (isScanning) return;

    setIsScanning(true);
    setError(null);

    try {
      const result = type === 'passive'
        ? await passiveScan(shipId)
        : await activeScan(shipId);

      updateFromScan(result.contacts);
      setLastScanTime(Date.now());
    } catch (err) {
      setError('Scan failed');
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [shipId, isScanning, updateFromScan]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={styles.compactScanButton}
          onPress={() => handleScan('passive')}
          disabled={isScanning}
        >
          <Feather
            name="radio"
            size={16}
            color={isScanning ? Colors.textSecondary : Colors.primary}
          />
          <Text style={styles.compactContactCount}>
            {contactsList.length}
          </Text>
        </TouchableOpacity>
        {hostileContacts.length > 0 && (
          <View style={styles.hostileIndicator}>
            <Text style={styles.hostileCount}>{hostileContacts.length}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="radio" size={14} color={Colors.primary} />
          <Text style={styles.headerTitle}>SCANNER</Text>
        </View>
        <Text style={styles.rangeText}>{(sensorRange / 1000).toFixed(1)}k range</Text>
      </View>

      {/* Scan Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={() => handleScan('passive')}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'SCANNING...' : 'PASSIVE'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanButton, styles.activeButton, isScanning && styles.scanButtonDisabled]}
          onPress={() => handleScan('active')}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>ACTIVE</Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Contact Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{contactsList.length}</Text>
          <Text style={styles.summaryLabel}>CONTACTS</Text>
        </View>
        {hostileContacts.length > 0 && (
          <View style={[styles.summaryItem, styles.hostileSummary]}>
            <Text style={[styles.summaryValue, styles.hostileValue]}>
              {hostileContacts.length}
            </Text>
            <Text style={[styles.summaryLabel, styles.hostileLabel]}>HOSTILE</Text>
          </View>
        )}
      </View>

      {/* Contact List */}
      <ScrollView style={styles.contactList}>
        {contactsList.length === 0 ? (
          <Text style={styles.noContacts}>No contacts detected</Text>
        ) : (
          contactsList.map((contact) => (
            <TouchableOpacity
              key={contact.entity_id}
              style={styles.contactItem}
              onPress={() => onContactSelect?.(contact)}
            >
              <View
                style={[
                  styles.classificationDot,
                  { backgroundColor: getClassificationColor(contact.classification) },
                ]}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactType}>
                  {contact.details?.name || contact.entity_type.toUpperCase()}
                </Text>
                <Text style={styles.contactDistance}>
                  {(contact.distance / 1000).toFixed(1)}k units
                </Text>
              </View>
              <View style={styles.signalBar}>
                <View
                  style={[
                    styles.signalFill,
                    { width: `${contact.signal_strength * 100}%` },
                  ]}
                />
              </View>
              {contact.position_accuracy < 0.9 && (
                <Feather name="help-circle" size={12} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Last Scan Time */}
      {lastScanTime && (
        <Text style={styles.lastScanText}>
          Last scan: {Math.floor((Date.now() - lastScanTime) / 1000)}s ago
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 1,
  },
  rangeText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  scanButton: {
    flex: 1,
    backgroundColor: Colors.primary + '20',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  activeButton: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning + '40',
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 10,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  hostileSummary: {
    backgroundColor: Colors.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hostileValue: {
    color: Colors.danger,
  },
  hostileLabel: {
    color: Colors.danger,
  },
  contactList: {
    maxHeight: 150,
  },
  noContacts: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  classificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contactInfo: {
    flex: 1,
  },
  contactType: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  contactDistance: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  signalBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  signalFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  lastScanText: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactContactCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  hostileIndicator: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostileCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
