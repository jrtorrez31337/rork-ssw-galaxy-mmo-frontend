import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Skull, MapPin, Anchor, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useRespawnStore } from '@/stores/respawnStore';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Respawn Overlay
 *
 * Full-screen overlay that appears when the player's ship is destroyed.
 * Shows respawn location and allows player to respawn.
 *
 * Per Gap Analysis Sprint 2: Respawn Flow
 * - Detect ship destruction (hull=0)
 * - Display respawn location options
 * - Execute respawn and reset state
 */

export function RespawnOverlay() {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();

  const {
    isDestroyed,
    destroyedInSector,
    destroyedByEntity,
    respawnLocation,
    isLoadingLocation,
    locationError,
    isRespawning,
    respawnError,
    fetchRespawnLocation,
    executeRespawn,
  } = useRespawnStore();

  // Fade animation
  const [fadeAnim] = React.useState(() => new Animated.Value(0));

  // Fetch respawn location when destroyed
  useEffect(() => {
    if (isDestroyed && profileId && !respawnLocation && !isLoadingLocation) {
      fetchRespawnLocation(profileId);
    }
  }, [isDestroyed, profileId, respawnLocation, isLoadingLocation, fetchRespawnLocation]);

  // Animate overlay appearance
  useEffect(() => {
    if (isDestroyed) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isDestroyed, fadeAnim]);

  const handleRespawn = async () => {
    if (!profileId) return;

    const result = await executeRespawn(profileId);
    if (result) {
      // Invalidate queries to refresh game state
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      queryClient.invalidateQueries({ queryKey: ['snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['sector'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  };

  const handleRetryLocation = () => {
    if (profileId) {
      fetchRespawnLocation(profileId);
    }
  };

  if (!isDestroyed) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.container}>
        {/* Death Icon */}
        <View style={styles.iconContainer}>
          <Skull size={64} color={tokens.colors.lcars.red} />
        </View>

        {/* Death Message */}
        <Text style={styles.title}>SHIP DESTROYED</Text>
        <Text style={styles.subtitle}>
          Your vessel has been lost in sector {destroyedInSector || 'Unknown'}
        </Text>
        {destroyedByEntity && (
          <Text style={styles.killedBy}>
            Destroyed by: {destroyedByEntity}
          </Text>
        )}

        {/* Respawn Location */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>RESPAWN LOCATION</Text>

          {isLoadingLocation && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
              <Text style={styles.loadingText}>Calculating respawn point...</Text>
            </View>
          )}

          {locationError && (
            <View style={styles.errorContainer}>
              <AlertTriangle size={24} color={tokens.colors.danger} />
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetryLocation}>
                <RefreshCw size={16} color={tokens.colors.primary.main} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {respawnLocation && !isLoadingLocation && (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                {respawnLocation.respawn_type === 'faction_station' ? (
                  <Anchor size={24} color={tokens.colors.lcars.gold} />
                ) : (
                  <MapPin size={24} color={tokens.colors.lcars.sky} />
                )}
                <Text style={styles.locationType}>
                  {respawnLocation.respawn_type === 'faction_station'
                    ? 'Faction Station'
                    : 'Home Sector'}
                </Text>
              </View>

              <View style={styles.locationDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sector:</Text>
                  <Text style={styles.detailValue}>{respawnLocation.sector}</Text>
                </View>

                {respawnLocation.station_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Station:</Text>
                    <Text style={styles.detailValue}>{respawnLocation.station_name}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distance:</Text>
                  <Text style={styles.detailValue}>
                    {respawnLocation.distance_from_death.toFixed(1)} sectors
                  </Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <AlertTriangle size={16} color={tokens.colors.warning} />
                <Text style={styles.warningText}>
                  Your ship will respawn with reduced hull, shields, and fuel
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Respawn Button */}
        {respawnLocation && (
          <TouchableOpacity
            style={[styles.respawnButton, isRespawning && styles.respawnButtonDisabled]}
            onPress={handleRespawn}
            disabled={isRespawning}
          >
            {isRespawning ? (
              <>
                <ActivityIndicator size="small" color={tokens.colors.text.inverse} />
                <Text style={styles.respawnButtonText}>RESPAWNING...</Text>
              </>
            ) : (
              <>
                <RefreshCw size={20} color={tokens.colors.text.inverse} />
                <Text style={styles.respawnButtonText}>RESPAWN</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {respawnError && (
          <Text style={styles.respawnError}>{respawnError}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  container: {
    width: '90%',
    maxWidth: 400,
    padding: tokens.spacing[6],
    alignItems: 'center',
  },

  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${tokens.colors.lcars.red}20`,
    borderWidth: 2,
    borderColor: tokens.colors.lcars.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing[6],
  },

  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.red,
    marginBottom: tokens.spacing[2],
    textAlign: 'center',
  },

  subtitle: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },

  killedBy: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: tokens.spacing[6],
  },

  locationSection: {
    width: '100%',
    marginBottom: tokens.spacing[6],
  },

  sectionTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    marginBottom: tokens.spacing[3],
    textAlign: 'center',
  },

  loadingContainer: {
    alignItems: 'center',
    padding: tokens.spacing[6],
  },

  loadingText: {
    marginTop: tokens.spacing[3],
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.sm,
  },

  errorContainer: {
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: `${tokens.colors.danger}20`,
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.danger,
  },

  errorText: {
    color: tokens.colors.danger,
    fontSize: tokens.typography.fontSize.sm,
    marginVertical: tokens.spacing[2],
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
  },

  retryText: {
    color: tokens.colors.primary.main,
    fontSize: tokens.typography.fontSize.sm,
  },

  locationCard: {
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    padding: tokens.spacing[4],
  },

  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
    paddingBottom: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },

  locationType: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },

  locationDetails: {
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[4],
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },

  detailValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: `${tokens.colors.warning}15`,
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.base,
  },

  warningText: {
    flex: 1,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.warning,
  },

  respawnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.primary.main,
    paddingVertical: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[8],
    borderRadius: tokens.radius.base,
    width: '100%',
  },

  respawnButtonDisabled: {
    backgroundColor: tokens.colors.text.disabled,
  },

  respawnButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
  },

  respawnError: {
    marginTop: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.danger,
    textAlign: 'center',
  },
});
