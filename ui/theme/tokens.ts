/**
 * Design Tokens - Space MMO Theme
 * "Command Console" aesthetic: Dark surfaces, neon accents, tactical readability
 */

export const tokens = {
  // COLORS
  colors: {
    // Backgrounds
    background: {
      primary: '#0a0e1a', // Deep space (main app bg)
      secondary: '#141b2e', // Panel background
      tertiary: '#1a2238', // Elevated surfaces
    },

    // Surfaces
    surface: {
      base: '#141b2e',
      raised: '#1a2238',
      overlay: '#1e293b',
      card: '#1a2238',
      modal: '#141b2e',
    },

    // Interactive
    primary: {
      main: '#00d4ff', // Cyan (main CTA, selected items)
      dark: '#0099cc', // Darker cyan (hover/pressed)
      light: '#33e0ff', // Lighter cyan (subtle accents)
      alpha: {
        10: 'rgba(0, 212, 255, 0.1)',
        20: 'rgba(0, 212, 255, 0.2)',
        30: 'rgba(0, 212, 255, 0.3)',
      },
    },

    secondary: {
      main: '#7c3aed', // Purple (secondary actions)
      dark: '#6d28d9',
      light: '#8b5cf6',
    },

    // Semantic
    success: '#10b981', // Green (success states)
    warning: '#f59e0b', // Amber (warnings, caution)
    danger: '#ef4444', // Red (errors, critical, destructive)
    info: '#3b82f6', // Blue (info, neutral notifications)

    // Text
    text: {
      primary: '#e2e8f0', // Main text (high contrast)
      secondary: '#94a3b8', // Secondary text (medium contrast)
      tertiary: '#64748b', // Tertiary text (low contrast)
      disabled: '#475569', // Disabled text
      inverse: '#0a0e1a', // Text on light backgrounds
    },

    // Borders
    border: {
      default: '#1e293b', // Default borders
      light: '#334155', // Lighter borders (elevated surfaces)
      focus: '#00d4ff', // Focus/active borders
      error: '#ef4444', // Error state borders
    },

    // Special
    backdrop: 'rgba(10, 14, 26, 0.8)', // Modal backdrop
    overlay: 'rgba(20, 27, 46, 0.95)', // Glass overlay (HUD)
  },

  // SPACING (8px base unit)
  spacing: {
    0: 0,
    1: 4, // 0.5 × base
    2: 8, // 1 × base
    3: 12, // 1.5 × base
    4: 16, // 2 × base
    5: 20, // 2.5 × base
    6: 24, // 3 × base
    8: 32, // 4 × base
    10: 40, // 5 × base
    12: 48, // 6 × base
    16: 64, // 8 × base
    20: 80, // 10 × base
    24: 96, // 12 × base
  },

  // TYPOGRAPHY
  typography: {
    fontFamily: {
      body: 'System', // Default system font
      mono: 'Courier', // For numbers, stats, coordinates
    },

    fontSize: {
      xs: 11, // Micro text (timestamps, captions)
      sm: 12, // Small text (labels, secondary info)
      base: 14, // Body text (default)
      md: 16, // Medium text (emphasized body)
      lg: 18, // Large text (card titles)
      xl: 20, // Section headers
      '2xl': 24, // Page titles
      '3xl': 32, // Hero text
      '4xl': 40, // Display text
    },

    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // BORDER RADIUS
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // ELEVATION (shadows)
  elevation: {
    0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 16,
    },
  },

  // Z-INDEX
  zIndex: {
    base: 0,
    dropdown: 50,
    sticky: 100,
    fixed: 200,
    modalBackdrop: 300,
    modal: 400,
    popover: 500,
    toast: 600,
  },

  // ANIMATION
  animation: {
    duration: {
      fast: 100,
      normal: 200,
      slow: 300,
      verySlow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // LAYOUT
  layout: {
    topBar: {
      height: 60,
    },
    tabBar: {
      height: 70,
    },
    maxContentWidth: 1200, // Max width for tablet/web
    gutter: 24, // Side padding for screens
  },

  // INTERACTION
  interaction: {
    minTouchTarget: 44, // Minimum tap target size (iOS HIG)
    iconSize: {
      sm: 16,
      base: 20,
      md: 24,
      lg: 32,
    },
  },
} as const;

// Type-safe token access
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
