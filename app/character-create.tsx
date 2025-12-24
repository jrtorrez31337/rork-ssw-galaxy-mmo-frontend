import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { User, ChevronLeft, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { characterApi } from '@/api/characters';
import { CharacterAttributes } from '@/types/api';
import Colors from '@/constants/colors';

const TOTAL_POINTS = 20;
const MIN_STAT = 1;
const MAX_STAT = 10;

const ATTRIBUTES = [
  {
    key: 'piloting' as keyof CharacterAttributes,
    label: 'Piloting',
    description: 'Ship maneuverability and flight control',
  },
  {
    key: 'engineering' as keyof CharacterAttributes,
    label: 'Engineering',
    description: 'Tech/repair bonuses and ship systems',
  },
  {
    key: 'science' as keyof CharacterAttributes,
    label: 'Science',
    description: 'Research, discovery, and scanning',
  },
  {
    key: 'tactics' as keyof CharacterAttributes,
    label: 'Tactics',
    description: 'Combat effectiveness and strategy',
  },
  {
    key: 'leadership' as keyof CharacterAttributes,
    label: 'Leadership',
    description: 'Crew bonuses and faction influence',
  },
];

export default function CharacterCreateScreen() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState<CharacterAttributes>({
    piloting: 4,
    engineering: 4,
    science: 4,
    tactics: 4,
    leadership: 4,
  });

  const totalAllocated = useMemo(() => {
    return Object.values(attributes).reduce((sum, val) => sum + val, 0);
  }, [attributes]);

  const remaining = TOTAL_POINTS - totalAllocated;

  const increment = (key: keyof CharacterAttributes) => {
    if (remaining > 0 && attributes[key] < MAX_STAT) {
      setAttributes({ ...attributes, [key]: attributes[key] + 1 });
    }
  };

  const decrement = (key: keyof CharacterAttributes) => {
    if (attributes[key] > MIN_STAT) {
      setAttributes({ ...attributes, [key]: attributes[key] - 1 });
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      characterApi.create({
        profile_id: profileId!,
        name,
        home_sector: 'sol',
        attributes,
      }),
    onSuccess: () => {
      router.back();
    },
  });

  const canSubmit = name.length >= 3 && remaining === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <User size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Create Character</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Character Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter character name"
            placeholderTextColor={Colors.textDim}
            value={name}
            onChangeText={setName}
            maxLength={32}
          />
          <Text style={styles.helperText}>3-32 characters</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.pointsHeader}>
            <Text style={styles.sectionTitle}>Attribute Points</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>
                {remaining} / {TOTAL_POINTS}
              </Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            Allocate {TOTAL_POINTS} points across your attributes
          </Text>

          <View style={styles.attributeList}>
            {ATTRIBUTES.map((attr) => {
              const value = attributes[attr.key];
              const percentage = (value / MAX_STAT) * 100;

              return (
                <View key={attr.key} style={styles.attributeCard}>
                  <View style={styles.attributeHeader}>
                    <View style={styles.attributeInfo}>
                      <Text style={styles.attributeLabel}>{attr.label}</Text>
                      <Text style={styles.attributeDescription}>
                        {attr.description}
                      </Text>
                    </View>
                    <View style={styles.attributeValue}>
                      <Text style={styles.valueText}>{value}</Text>
                    </View>
                  </View>

                  <View style={styles.attributeControls}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${percentage}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.buttons}>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          value <= MIN_STAT && styles.controlButtonDisabled,
                        ]}
                        onPress={() => decrement(attr.key)}
                        disabled={value <= MIN_STAT}
                      >
                        <Text
                          style={[
                            styles.controlButtonText,
                            value <= MIN_STAT &&
                              styles.controlButtonTextDisabled,
                          ]}
                        >
                          −
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          (value >= MAX_STAT || remaining <= 0) &&
                            styles.controlButtonDisabled,
                        ]}
                        onPress={() => increment(attr.key)}
                        disabled={value >= MAX_STAT || remaining <= 0}
                      >
                        <Text
                          style={[
                            styles.controlButtonText,
                            (value >= MAX_STAT || remaining <= 0) &&
                              styles.controlButtonTextDisabled,
                          ]}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {createMutation.isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {createMutation.error?.message || 'Failed to create character'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            (!canSubmit || createMutation.isPending) &&
              styles.createButtonDisabled,
          ]}
          onPress={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Text style={styles.createButtonText}>Creating...</Text>
          ) : (
            <>
              <Check size={20} color={Colors.background} />
              <Text style={styles.createButtonText}>Create Character</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 8,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  attributeList: {
    marginTop: 16,
    gap: 12,
  },
  attributeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attributeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  attributeInfo: {
    flex: 1,
    marginRight: 12,
  },
  attributeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  attributeDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  attributeValue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  attributeControls: {
    gap: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlButtonText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  controlButtonTextDisabled: {
    color: Colors.textDim,
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: `${Colors.danger}20`,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    height: 56,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
