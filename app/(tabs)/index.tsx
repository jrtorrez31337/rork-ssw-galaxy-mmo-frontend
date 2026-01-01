import React from 'react';
import { View } from 'react-native';

/**
 * Bridge Entry Point - Minimal Placeholder
 *
 * Per Viewscreen Architecture:
 * - All content rendering is handled by Viewscreen in CockpitShell
 * - This file exists only to satisfy Expo Router's requirement
 *   for at least one screen in a route group
 * - The CockpitShell renders directly in _layout.tsx
 */

export default function BridgeScreen() {
  // Empty - Viewscreen handles all content
  return <View />;
}
