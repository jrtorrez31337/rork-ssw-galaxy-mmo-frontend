import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Backdrop } from './Backdrop';
import { Handle } from './Handle';
import { tokens } from '../../theme';

export type BottomSheetHeight = 'half' | 'threequarter' | 'full' | number;

interface BottomSheetProps {
  visible: boolean;
  height?: BottomSheetHeight;
  onClose: () => void;
  showHandle?: boolean;
  backdrop?: boolean;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  height = 'half',
  onClose,
  showHandle = true,
  backdrop = true,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  // Use hook for dynamic screen height (fixes iOS Expo Go rendering issue)
  const { height: screenHeight } = useWindowDimensions();
  const SCREEN_HEIGHT = screenHeight > 0 ? screenHeight : 800; // Fallback for initial render

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Calculate sheet height
  const getSheetHeight = (): number => {
    if (typeof height === 'number') return height;
    switch (height) {
      case 'half':
        return SCREEN_HEIGHT * 0.5;
      case 'threequarter':
        return SCREEN_HEIGHT * 0.75;
      case 'full':
        return SCREEN_HEIGHT * 0.9;
      default:
        return SCREEN_HEIGHT * 0.5;
    }
  };

  const sheetHeight = getSheetHeight();

  // Pan responder for swipe-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow downward swipes
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Swipe down detected - close
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleClose();
        } else {
          // Snap back to open position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      // Animate in
      translateY.setValue(sheetHeight);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [visible, sheetHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {backdrop && <Backdrop visible={visible} onPress={handleClose} opacity={backdropOpacity} />}

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight + insets.bottom,
              paddingBottom: insets.bottom,
              transform: [{ translateY }],
            },
          ]}
          {...(showHandle ? panResponder.panHandlers : {})}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {showHandle && <Handle />}
            <View style={styles.content}>{children}</View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.colors.surface.modal,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: tokens.colors.border.light,
    ...tokens.elevation[4],
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing[6],
  },
});
