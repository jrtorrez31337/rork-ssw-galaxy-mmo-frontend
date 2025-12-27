import { Dimensions } from 'react-native';
import { tokens } from './tokens';

/**
 * Hook to access design tokens
 * Usage: const { colors, spacing } = useTheme();
 */
export const useTheme = () => {
  return tokens;
};

/**
 * Utility to get responsive spacing based on screen size
 */
export const useResponsiveSpacing = () => {
  const { width } = Dimensions.get('window');
  const isTablet = width >= 768;

  return {
    gutter: isTablet ? tokens.spacing[8] : tokens.spacing[6],
    contentPadding: isTablet ? tokens.spacing[10] : tokens.spacing[4],
  };
};

/**
 * Utility to check device type
 */
export const useDeviceType = () => {
  const { width } = Dimensions.get('window');

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
};
