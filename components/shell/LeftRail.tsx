import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Navigation, Target, Wrench, Radio, Crosshair, Rocket, LucideIcon } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore, RailSystem } from '@/stores/cockpitStore';

/**
 * LeftRail (Systems Rail)
 * Per UI/UX Doctrine Section 2: Always visible, 64-80pt width
 * Contains: NAV, OPS, TAC, ENG, COM
 * Single-tap selects system and populates Contextual Panel
 */

interface RailButtonProps {
  system: RailSystem;
  Icon: LucideIcon;
  label: string;
  isActive: boolean;
  isPulsing?: boolean;
  onPress: () => void;
}

function RailButton({ system, Icon, label, isActive, isPulsing, onPress }: RailButtonProps) {
  const getSystemColor = () => {
    switch (system) {
      case 'NAV': return tokens.colors.semantic.navigation;
      case 'OPS': return tokens.colors.semantic.economy;
      case 'TAC': return tokens.colors.semantic.combat;
      case 'ENG': return tokens.colors.lcars.peach;
      case 'COM': return tokens.colors.semantic.communications;
      case 'FLT': return tokens.colors.lcars.sky;
      default: return tokens.colors.lcars.orange;
    }
  };

  const color = getSystemColor();
  const opacity = isActive ? 1 : 0.6;

  return (
    <TouchableOpacity
      style={[
        styles.railButton,
        isActive && styles.railButtonActive,
        isActive && { borderLeftColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { opacity }]}>
        <Icon
          color={isActive ? color : tokens.colors.text.tertiary}
          size={24}
        />
      </View>
      <Text
        style={[
          styles.railLabel,
          { color: isActive ? color : tokens.colors.text.tertiary, opacity },
        ]}
      >
        {label}
      </Text>
      {isPulsing && <View style={[styles.pulseIndicator, { backgroundColor: color }]} />}
    </TouchableOpacity>
  );
}

export function LeftRail() {
  const activeRail = useCockpitStore((s) => s.activeRail);
  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const setActiveRail = useCockpitStore((s) => s.setActiveRail);

  // Per doctrine: TAC pulses during combat, NAV pulses during travel
  const tacPulsing = alertLevel === 'red';
  const navPulsing = false; // TODO: Connect to travel state

  const railItems: { system: RailSystem; Icon: LucideIcon; label: string }[] = [
    { system: 'NAV', Icon: Navigation, label: 'NAV' },
    { system: 'FLT', Icon: Rocket, label: 'FLT' },
    { system: 'OPS', Icon: Target, label: 'OPS' },
    { system: 'TAC', Icon: Crosshair, label: 'TAC' },
    { system: 'ENG', Icon: Wrench, label: 'ENG' },
    { system: 'COM', Icon: Radio, label: 'COM' },
  ];

  return (
    <View style={styles.container}>
      {railItems.map((item) => (
        <RailButton
          key={item.system}
          system={item.system}
          Icon={item.Icon}
          label={item.label}
          isActive={activeRail === item.system}
          isPulsing={
            (item.system === 'TAC' && tacPulsing) ||
            (item.system === 'NAV' && navPulsing)
          }
          onPress={() => setActiveRail(item.system)}
        />
      ))}

      {/* Bottom spacer to push buttons toward top */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    backgroundColor: tokens.colors.background.panel,
    borderRightWidth: 1,
    borderRightColor: tokens.colors.border.default,
    paddingTop: tokens.spacing[2],
    paddingBottom: tokens.spacing[2],
  },
  railButton: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    position: 'relative',
  },
  railButtonActive: {
    backgroundColor: tokens.colors.background.tertiary,
  },
  iconContainer: {
    marginBottom: 4,
  },
  railLabel: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  pulseIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  spacer: {
    flex: 1,
  },
});
