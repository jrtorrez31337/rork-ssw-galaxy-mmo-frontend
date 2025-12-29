/**
 * Design Tokens - Space MMO Theme
 * LCARS-inspired "Bridge Console" aesthetic per UI/UX Doctrine
 */

export const tokens = {
  // COLORS
  colors: {
    // LCARS Primary Palette (per doctrine)
    lcars: {
      orange: '#FF9900',      // Primary interactive, combat
      peach: '#FFCC99',       // Secondary interactive
      violet: '#CC99CC',      // Communications
      blue: '#9999FF',        // Navigation (periwinkle)
      sky: '#99CCFF',         // Information
      red: '#CC6666',         // Alert/danger
      gold: '#FFCC00',        // Economy/value
      green: '#99CC99',       // Success/health
      beige: '#FFCC99',       // Inactive
    },

    // Semantic mappings (LCARS doctrine)
    semantic: {
      navigation: '#9999FF',    // Blue - travel, movement
      combat: '#FF9900',        // Orange - weapons, tactical
      economy: '#FFCC00',       // Gold - trade, currency
      communications: '#CC99CC', // Violet - chat, faction
      information: '#99CCFF',   // Sky - passive, neutral
      danger: '#CC6666',        // Red - alerts, damage
      success: '#99CC99',       // Green - health, positive
      warning: '#FFCC00',       // Gold - caution
    },

    // Backgrounds (LCARS dark theme)
    background: {
      primary: '#000000',   // True black for viewport
      secondary: '#1a1a2e', // Panel backgrounds
      tertiary: '#252540',  // Elevated surfaces
      space: '#000000',     // Viewport background
      panel: '#1a1a2e',     // Dark blue-gray panels
      bezel: '#0d0d1a',     // Frame borders
    },

    // Surfaces
    surface: {
      base: '#1a1a2e',
      raised: '#252540',
      overlay: '#1e293b',
      card: '#1a1a2e',
      modal: '#141b2e',
    },

    // Interactive (using LCARS orange as primary)
    primary: {
      main: '#FF9900',      // LCARS orange
      dark: '#CC7A00',      // Darker orange
      light: '#FFAD33',     // Lighter orange
      alpha: {
        10: 'rgba(255, 153, 0, 0.1)',
        20: 'rgba(255, 153, 0, 0.2)',
        30: 'rgba(255, 153, 0, 0.3)',
      },
    },

    secondary: {
      main: '#CC99CC',      // LCARS violet
      dark: '#AA77AA',
      light: '#DDAADD',
    },

    // Semantic (legacy compat + LCARS)
    success: '#99CC99',     // LCARS green
    warning: '#FFCC00',     // LCARS gold
    danger: '#CC6666',      // LCARS red
    info: '#99CCFF',        // LCARS sky

    // Text (LCARS uses orange/peach for headers)
    text: {
      primary: '#FF9900',   // LCARS orange for headers
      secondary: '#FFCC99', // Peach for body
      tertiary: '#666680',  // Dimmed
      disabled: '#444455',  // Disabled text
      inverse: '#000000',   // Text on light backgrounds
      body: '#CCCCDD',      // Standard body text
    },

    // Borders
    border: {
      default: '#333344',   // Default borders
      light: '#444466',     // Lighter borders
      focus: '#FF9900',     // Focus/active (LCARS orange)
      error: '#CC6666',     // Error state
    },

    // Alert colors (per doctrine cascade)
    alert: {
      green: '#99CC99',     // Normal operations
      yellow: '#FFCC00',    // Caution
      red: '#CC6666',       // Combat/emergency
      redPulse: 'rgba(204, 102, 102, 0.3)', // Red alert overlay
      yellowVignette: 'rgba(255, 204, 0, 0.1)', // Yellow alert vignette
    },

    // Special
    backdrop: 'rgba(0, 0, 0, 0.8)',
    overlay: 'rgba(26, 26, 46, 0.95)',
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
