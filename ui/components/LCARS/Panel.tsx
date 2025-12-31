import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, AccessibilityProps } from 'react-native';
import { tokens } from '@/ui/theme';

/**
 * LCARSPanel - LCARS-style panel container
 *
 * Per UI/UX Doctrine:
 * - Characteristic rounded left corners, square right
 * - Header strip with title
 * - Color-coded by system context
 * - Never obscures viewport completely
 *
 * Accessibility:
 * - Semantic role as region
 * - Label via title prop
 */

export type PanelVariant = 'navigation' | 'combat' | 'economy' | 'communications' | 'engineering' | 'info';

interface PanelProps extends AccessibilityProps {
  title?: string;
  variant?: PanelVariant;
  children: ReactNode;
  style?: ViewStyle;
  headerRight?: ReactNode;
  noPadding?: boolean;
}

function getVariantColor(variant: PanelVariant): string {
  switch (variant) {
    case 'navigation': return tokens.colors.semantic.navigation;
    case 'combat': return tokens.colors.semantic.combat;
    case 'economy': return tokens.colors.semantic.economy;
    case 'communications': return tokens.colors.semantic.communications;
    case 'engineering': return tokens.colors.lcars.peach;
    case 'info':
    default: return tokens.colors.semantic.information;
  }
}

export function Panel({
  title,
  variant = 'info',
  children,
  style,
  headerRight,
  noPadding = false,
  ...accessibilityProps
}: PanelProps) {
  const accentColor = getVariantColor(variant);

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="none"
      accessibilityLabel={title}
      {...accessibilityProps}
    >
      {/* LCARS bracket - left side */}
      <View style={[styles.bracket, { backgroundColor: accentColor }]} />

      {/* Main content area */}
      <View style={styles.main}>
        {/* Header */}
        {title && (
          <View style={styles.header}>
            <View style={[styles.headerAccent, { backgroundColor: accentColor }]} />
            <Text
              style={[styles.headerTitle, { color: accentColor }]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
          </View>
        )}

        {/* Content */}
        <View style={[styles.content, noPadding && styles.contentNoPadding]}>
          {children}
        </View>
      </View>
    </View>
  );
}

/**
 * PanelSection - Subdivide panel content
 */
interface PanelSectionProps {
  title?: string;
  children: ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <View style={styles.section}>
      {title && (
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

/**
 * PanelRow - Horizontal layout within panel
 */
interface PanelRowProps {
  children: ReactNode;
  spacing?: 'tight' | 'normal' | 'wide';
}

export function PanelRow({ children, spacing = 'normal' }: PanelRowProps) {
  const gap = spacing === 'tight' ? tokens.spacing[2] :
              spacing === 'wide' ? tokens.spacing[6] : tokens.spacing[4];

  return (
    <View style={[styles.row, { gap }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.background.panel,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  bracket: {
    width: 8,
    borderTopLeftRadius: tokens.radius.lg,
    borderBottomLeftRadius: tokens.radius.lg,
  },
  main: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
    paddingRight: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  headerAccent: {
    width: 4,
    height: 20,
    marginRight: tokens.spacing[3],
    borderRadius: 2,
  },
  headerTitle: {
    flex: 1,
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerRight: {
    marginLeft: tokens.spacing[2],
  },
  content: {
    padding: tokens.spacing[3],
  },
  contentNoPadding: {
    padding: 0,
  },
  section: {
    marginBottom: tokens.spacing[4],
  },
  sectionTitle: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: tokens.spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
