/**
 * Design Tokens - Command Console Theme
 * Space MMO "Command Terminal" aesthetic
 * Darker, GitHub-inspired palette with Trek accents
 */

export const tokens = {
  // COLORS - Command Console Theme
  colors: {
    // Core console colors (deeper, richer darks)
    console: {
      void: '#0a0c10',       // Deepest black - primary background
      deepSpace: '#0d1117',  // Panel backgrounds
      nebula: '#161b22',     // Elevated surfaces
      hull: '#21262d',       // Interactive surface backgrounds
      panel: '#30363d',      // Borders, dividers
    },

    // Command accent colors (Trek-inspired)
    command: {
      gold: '#f0b429',       // Primary accent, warnings, captain
      blue: '#58a6ff',       // Navigation, info, interactive
      red: '#f85149',        // Danger, combat, alerts
    },

    // Operations colors
    operations: {
      orange: '#d29922',     // Operations, activity
      science: '#388bfd',    // Science, scanning, info
      engineering: '#e3b341', // Engineering, systems
    },

    // Legacy LCARS mapping (backward compatibility)
    lcars: {
      orange: '#f0b429',     // Maps to command.gold
      peach: '#e6b87a',      // Softer gold
      violet: '#a371f7',     // Updated violet
      blue: '#58a6ff',       // Maps to command.blue
      sky: '#79c0ff',        // Lighter blue
      red: '#f85149',        // Maps to command.red
      gold: '#e3b341',       // Maps to operations.engineering
      green: '#3fb950',      // Success green
      beige: '#8b949e',      // Neutral text
    },

    // Semantic mappings
    semantic: {
      navigation: '#58a6ff',   // Blue - travel, movement
      combat: '#f85149',       // Red - weapons, tactical
      economy: '#e3b341',      // Gold - trade, currency
      communications: '#a371f7', // Violet - chat, faction
      information: '#79c0ff',  // Sky - passive, neutral
      danger: '#f85149',       // Red - alerts, damage
      success: '#3fb950',      // Green - health, positive
      warning: '#d29922',      // Orange - caution
    },

    // Alert states
    alert: {
      critical: '#da3633',
      warning: '#d29922',
      info: '#388bfd',
      success: '#238636',
      green: '#3fb950',       // Normal operations
      yellow: '#d29922',      // Caution
      red: '#f85149',         // Combat/emergency
      redPulse: 'rgba(248, 81, 73, 0.3)',     // Red alert overlay
      yellowVignette: 'rgba(210, 153, 34, 0.1)', // Yellow alert vignette
    },

    // Status indicators
    status: {
      online: '#3fb950',
      offline: '#6e7681',
      standby: '#d29922',
      danger: '#f85149',
    },

    // Backgrounds
    background: {
      primary: '#0a0c10',    // Void - main background
      secondary: '#0d1117',  // DeepSpace - panels
      tertiary: '#161b22',   // Nebula - elevated
      space: '#0a0c10',      // Viewport background
      panel: '#0d1117',      // Panel backgrounds
      bezel: '#21262d',      // Frame borders
    },

    // Surfaces
    surface: {
      base: '#0d1117',
      raised: '#161b22',
      overlay: '#21262d',
      card: '#161b22',
      modal: '#0d1117',
    },

    // Primary interactive (command blue)
    primary: {
      main: '#58a6ff',
      dark: '#388bfd',
      light: '#79c0ff',
      alpha: {
        10: 'rgba(88, 166, 255, 0.1)',
        20: 'rgba(88, 166, 255, 0.2)',
        30: 'rgba(88, 166, 255, 0.3)',
      },
    },

    // Secondary (violet)
    secondary: {
      main: '#a371f7',
      dark: '#8957e5',
      light: '#c297ff',
    },

    // Semantic colors (flat)
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    info: '#79c0ff',

    // Text
    text: {
      primary: '#e6edf3',    // High contrast white
      secondary: '#8b949e',  // Medium gray
      tertiary: '#6e7681',   // Dimmed
      disabled: '#484f58',   // Disabled text
      inverse: '#0a0c10',    // Text on light backgrounds
      body: '#c9d1d9',       // Standard body text
      muted: '#6e7681',      // Muted text
    },

    // Borders
    border: {
      default: '#30363d',
      light: '#484f58',
      focus: '#58a6ff',      // Focus/active
      error: '#f85149',      // Error state
      highlight: '#58a6ff',
      danger: '#f85149',
    },

    // Depth layers (for pseudo-3D effects)
    layer: {
      0: 'rgba(10, 12, 16, 0.95)',
      1: 'rgba(13, 17, 23, 0.9)',
      2: 'rgba(22, 27, 34, 0.85)',
      3: 'rgba(33, 38, 45, 0.8)',
    },

    // Glow effects
    glow: {
      blue: 'rgba(88, 166, 255, 0.4)',
      gold: 'rgba(240, 180, 41, 0.4)',
      red: 'rgba(248, 81, 73, 0.4)',
      green: 'rgba(63, 185, 80, 0.4)',
    },

    // Special
    backdrop: 'rgba(10, 12, 16, 0.8)',
    overlay: 'rgba(13, 17, 23, 0.95)',
  },

  // SPACING (8px base unit)
  spacing: {
    0: 0,
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    section: 48,
    // Numeric keys for backward compatibility
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },

  // TYPOGRAPHY
  typography: {
    fontFamily: {
      body: 'System',
      mono: 'monospace',    // Terminal aesthetic
      system: 'System',
    },

    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      display: 32,
      '2xl': 24,
      '3xl': 32,
      '4xl': 40,
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

    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 1,
      wider: 2,
      widest: 4,
    },
  },

  // BORDER RADIUS
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 8,
    lg: 12,
    xl: 16,
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
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 16,
    },
    // Named shadows
    panel: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    glow: {
      shadowColor: '#58a6ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 12,
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
      instant: 0,
      fast: 150,
      normal: 300,
      slow: 500,
      glacial: 1000,
    },
    timing: {
      instant: 0,
      fast: 150,
      normal: 300,
      slow: 500,
      glacial: 1000,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // LAYOUT
  layout: {
    headerBar: {
      height: 56,
    },
    navRail: {
      width: 80,
    },
    statusBar: {
      height: 48,
    },
    topBar: {
      height: 56,
    },
    tabBar: {
      height: 70,
    },
    maxContentWidth: 1200,
    gutter: 24,
  },

  // INTERACTION
  interaction: {
    minTouchTarget: 44,
    iconSize: {
      sm: 16,
      base: 20,
      md: 24,
      lg: 32,
    },
  },

  // PSEUDO-3D (for depth effects)
  pseudo3D: {
    parallaxRatios: {
      background: 0.1,
      midground: 0.5,
      foreground: 1.0,
    },
    perspective: 1000,
    tiltMax: 5,
    depthFog: {
      near: 0,
      far: 1,
      color: 'rgba(10, 12, 16, 0.8)',
    },
  },
} as const;

// Type-safe token access
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;

// Helper type for theme colors
export type ThemeColors = typeof tokens.colors;
export type ThemeTypography = typeof tokens.typography;
export type ThemeSpacing = typeof tokens.spacing;
