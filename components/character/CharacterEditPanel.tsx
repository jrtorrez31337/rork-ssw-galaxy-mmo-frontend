import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, User, Check } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Text, Button } from '@/ui';
import { characterApi } from '@/api/characters';
import { useQueryClient } from '@tanstack/react-query';
import type { Character } from '@/types/api';

interface CharacterEditPanelProps {
  character: Character;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * CharacterEditPanel
 * Slide-up panel for editing character name
 * Only name is editable after creation (attributes are immutable)
 */
export function CharacterEditPanel({
  character,
  visible,
  onClose,
  onSuccess,
}: CharacterEditPanelProps) {
  const [slideAnim] = useState(new Animated.Value(0));
  const [name, setName] = useState(character.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (visible) {
      setName(character.name);
      setError(null);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, character.name]);

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (trimmedName === character.name) {
      onClose();
      return;
    }

    if (trimmedName.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    if (trimmedName.length > 32) {
      setError('Name must be 32 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await characterApi.update(character.id, trimmedName);

      // Invalidate character queries to refetch
      queryClient.invalidateQueries({ queryKey: ['characters'] });

      Alert.alert('Success', 'Character name updated');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Failed to update character';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const hasChanges = name.trim() !== character.name;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <User size={24} color={tokens.colors.primary.main} />
              <View>
                <Text variant="heading" weight="bold">
                  Edit Character
                </Text>
                <Text variant="caption" color={tokens.colors.text.tertiary}>
                  {character.home_sector}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <X size={24} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text variant="caption" weight="semibold" color={tokens.colors.text.secondary}>
                CHARACTER NAME
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                placeholder="Enter character name"
                placeholderTextColor={tokens.colors.text.tertiary}
                maxLength={32}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Text variant="caption" color={tokens.colors.text.tertiary}>
                {name.length}/32 characters (min 3)
              </Text>
            </View>

            {/* Attribute Summary (read-only) */}
            <View style={styles.attributeInfo}>
              <Text variant="caption" weight="semibold" color={tokens.colors.text.secondary}>
                ATTRIBUTES (IMMUTABLE)
              </Text>
              <View style={styles.attributeGrid}>
                <View style={styles.attributeItem}>
                  <Text variant="caption" color={tokens.colors.text.tertiary}>PIL</Text>
                  <Text variant="body" weight="semibold" color={tokens.colors.text.secondary}>
                    {character.attributes.piloting}
                  </Text>
                </View>
                <View style={styles.attributeItem}>
                  <Text variant="caption" color={tokens.colors.text.tertiary}>ENG</Text>
                  <Text variant="body" weight="semibold" color={tokens.colors.text.secondary}>
                    {character.attributes.engineering}
                  </Text>
                </View>
                <View style={styles.attributeItem}>
                  <Text variant="caption" color={tokens.colors.text.tertiary}>SCI</Text>
                  <Text variant="body" weight="semibold" color={tokens.colors.text.secondary}>
                    {character.attributes.science}
                  </Text>
                </View>
                <View style={styles.attributeItem}>
                  <Text variant="caption" color={tokens.colors.text.tertiary}>TAC</Text>
                  <Text variant="body" weight="semibold" color={tokens.colors.text.secondary}>
                    {character.attributes.tactics}
                  </Text>
                </View>
                <View style={styles.attributeItem}>
                  <Text variant="caption" color={tokens.colors.text.tertiary}>LDR</Text>
                  <Text variant="body" weight="semibold" color={tokens.colors.text.secondary}>
                    {character.attributes.leadership}
                  </Text>
                </View>
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text variant="caption" color={tokens.colors.danger}>
                  {error}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="secondary"
              onPress={onClose}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              disabled={!hasChanges || isSubmitting}
              loading={isSubmitting}
              icon={Check}
              style={styles.actionButton}
            >
              Save Changes
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  keyboardView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  panel: {
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingBottom: tokens.spacing[6],
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },

  field: {
    gap: tokens.spacing[2],
  },

  input: {
    backgroundColor: tokens.colors.surface.raised,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
  },

  attributeInfo: {
    gap: tokens.spacing[2],
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.overlay,
    borderRadius: tokens.radius.base,
  },

  attributeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  attributeItem: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  errorContainer: {
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.danger + '20',
    borderRadius: tokens.radius.base,
  },

  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[2],
  },

  actionButton: {
    flex: 1,
  },
});
