import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  useWindowDimensions,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore, RailSystem, PanelState } from '@/stores/cockpitStore';

/**
 * ContextualPanel - LCARS Contextual Panel Zone
 *
 * Per UI/UX Doctrine Section 2:
 * - Height: 40-60% of viewport height, slides up from bottom
 * - Three states: hidden, peek (header only), expanded
 * - Swipe down to minimize, swipe up to expand
 * - Combat auto-minimizes to peek
 * - Only one panel visible at a time
 *
 * NOT a modal - renders inline within the cockpit shell.
 */

interface ContextualPanelProps {
  children: ReactNode;
  title?: string;
  headerRight?: ReactNode;
}

// Panel heights as percentage of available viewport
const PEEK_HEIGHT = 56;  // Just the header
const EXPANDED_RATIO = 0.55; // 55% of viewport

export function ContextualPanel({ children, title, headerRight }: ContextualPanelProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const panelState = useCockpitStore((s) => s.panelState);
  const activeRail = useCockpitStore((s) => s.activeRail);
  const setPanelState = useCockpitStore((s) => s.setPanelState);
  const alertLevel = useCockpitStore((s) => s.alertLevel);

  // Calculate heights
  const expandedHeight = screenHeight * EXPANDED_RATIO;
  const peekHeight = PEEK_HEIGHT;

  // Animation values
  const translateY = useRef(new Animated.Value(expandedHeight)).current;

  // Get target Y position based on state
  const getTargetY = (state: PanelState): number => {
    switch (state) {
      case 'hidden': return expandedHeight + peekHeight;
      case 'peek': return expandedHeight - peekHeight;
      case 'expanded': return 0;
      default: return expandedHeight;
    }
  };

  // Animate to new state
  useEffect(() => {
    const targetY = getTargetY(panelState);
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [panelState, expandedHeight]);

  // Auto-minimize during red alert per doctrine
  useEffect(() => {
    if (alertLevel === 'red' && panelState === 'expanded') {
      setPanelState('peek');
    }
  }, [alertLevel, panelState, setPanelState]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only respond to significant vertical swipes
        return Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderMove: (_, gesture) => {
        const currentY = getTargetY(panelState);
        const newY = Math.max(0, Math.min(currentY + gesture.dy, expandedHeight + peekHeight));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gesture) => {
        const velocity = gesture.vy;
        const currentY = getTargetY(panelState);
        const movedY = currentY + gesture.dy;

        // Determine new state based on position and velocity
        let newState: PanelState;

        if (velocity > 0.5) {
          // Fast swipe down
          newState = panelState === 'expanded' ? 'peek' : 'hidden';
        } else if (velocity < -0.5) {
          // Fast swipe up
          newState = panelState === 'hidden' ? 'peek' : 'expanded';
        } else {
          // Slow drag - snap to nearest
          const peekThreshold = expandedHeight - peekHeight / 2;
          const hiddenThreshold = expandedHeight + peekHeight / 2;

          if (movedY < peekThreshold / 2) {
            newState = 'expanded';
          } else if (movedY < hiddenThreshold) {
            newState = 'peek';
          } else {
            newState = 'hidden';
          }
        }

        setPanelState(newState);
      },
    })
  ).current;

  // Get rail color for header accent
  const getRailColor = (rail: RailSystem): string => {
    switch (rail) {
      case 'NAV': return tokens.colors.semantic.navigation;
      case 'OPS': return tokens.colors.semantic.economy;
      case 'TAC': return tokens.colors.semantic.combat;
      case 'ENG': return tokens.colors.lcars.peach;
      case 'COM': return tokens.colors.semantic.communications;
      default: return tokens.colors.lcars.orange;
    }
  };

  const railColor = getRailColor(activeRail);

  const handleHeaderPress = () => {
    if (panelState === 'peek') {
      setPanelState('expanded');
    } else if (panelState === 'expanded') {
      setPanelState('peek');
    }
  };

  // Don't render if hidden
  if (panelState === 'hidden') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: expandedHeight,
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Header - always visible in peek/expanded */}
      <TouchableOpacity
        style={[styles.header, { borderLeftColor: railColor }]}
        onPress={handleHeaderPress}
        activeOpacity={0.8}
      >
        <View style={[styles.headerAccent, { backgroundColor: railColor }]} />
        <Text style={[styles.headerTitle, { color: railColor }]}>
          {title || activeRail}
        </Text>
        {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        <View style={styles.headerChevron}>
          {panelState === 'expanded' ? (
            <ChevronDown size={20} color={tokens.colors.text.tertiary} />
          ) : (
            <ChevronUp size={20} color={tokens.colors.text.tertiary} />
          )}
        </View>
      </TouchableOpacity>

      {/* Content - only visible when expanded */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

/**
 * PanelContent - Scrollable content wrapper
 */
interface PanelContentProps {
  children: ReactNode;
}

export function PanelContent({ children }: PanelContentProps) {
  return <View style={styles.panelContent}>{children}</View>;
}

/**
 * PanelSection - Section divider within panel
 */
interface PanelSectionProps {
  title: string;
  children: ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colors.background.panel,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    overflow: 'hidden',
  },
  header: {
    height: PEEK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[3],
    borderLeftWidth: 4,
    backgroundColor: tokens.colors.background.tertiary,
  },
  headerAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: tokens.spacing[3],
  },
  headerTitle: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRight: {
    marginRight: tokens.spacing[2],
  },
  headerChevron: {
    padding: tokens.spacing[1],
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing[3],
    paddingTop: tokens.spacing[3],
  },
  panelContent: {
    flex: 1,
  },
  section: {
    marginBottom: tokens.spacing[4],
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[2],
  },
});
