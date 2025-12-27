/**
 * Legacy colors export for backward compatibility
 * @deprecated Import from '@/ui/theme' instead
 *
 * This file re-exports colors from the new token system to maintain
 * compatibility with existing code. New code should use tokens directly.
 */
import { tokens } from '@/ui/theme';

export default {
  background: tokens.colors.background.primary,
  surface: tokens.colors.surface.base,
  surfaceLight: tokens.colors.surface.raised,
  primary: tokens.colors.primary.main,
  primaryDark: tokens.colors.primary.dark,
  secondary: tokens.colors.secondary.main,
  accent: tokens.colors.warning, // Note: was duplicate of warning
  success: tokens.colors.success,
  warning: tokens.colors.warning,
  danger: tokens.colors.danger,
  info: tokens.colors.info, // Added for components that use it
  text: tokens.colors.text.primary,
  textSecondary: tokens.colors.text.secondary,
  textDim: tokens.colors.text.tertiary,
  border: tokens.colors.border.default,
  borderLight: tokens.colors.border.light,
};
