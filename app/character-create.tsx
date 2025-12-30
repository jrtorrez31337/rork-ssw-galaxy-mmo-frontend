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
import { User, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { characterApi } from '@/api/characters';
import { validateName } from '@/utils/validation';
import { CharacterAttributes } from '@/types/api';
import { FactionId, FACTION_METADATA, FACTION_UUIDS } from '@/types/factions';
import FactionSelectionStep from '@/components/character-create/FactionSelectionStep';
import Colors from '@/constants/colors';

const TOTAL_POINTS = 20;
const MIN_STAT = 1;
const MAX_STAT = 10;

type Step = 'name' | 'faction' | 'attributes';

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

  // Step management
  const [step, setStep] = useState<Step>('name');

  // Form state
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
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

  // Get the home sector from selected faction
  const getHomeSector = () => {
    if (!selectedFaction || selectedFaction === 'neutral') return '0.0.0';
    return FACTION_METADATA[selectedFaction].capitalSector;
  };

  // Get faction UUID
  const getFactionUUID = () => {
    if (!selectedFaction || selectedFaction === 'neutral') return undefined;
    return FACTION_UUIDS[selectedFaction];
  };

  const createMutation = useMutation({
    mutationFn: () =>
      characterApi.create({
        profile_id: profileId!,
        name,
        faction_id: getFactionUUID()!,
        home_sector: getHomeSector(),
        attributes,
      }),
    onSuccess: () => {
      router.back();
    },
  });

  // Name change handler with validation
  const handleNameChange = (text: string) => {
    setName(text);
    if (text.trim().length > 0) {
      const result = validateName(text);
      setNameError(result.isValid ? '' : result.error || '');
    } else {
      setNameError('');
    }
  };

  // Validation for each step
  const nameValidation = validateName(name);
  const canProceedFromName = nameValidation.isValid;
  const canProceedFromFaction = selectedFaction !== null;
  const canSubmit = canProceedFromName && canProceedFromFaction && remaining === 0;

  // Step navigation
  const goToNextStep = () => {
    if (step === 'name' && canProceedFromName) {
      setStep('faction');
    } else if (step === 'faction' && canProceedFromFaction) {
      setStep('attributes');
    }
  };

  const goToPreviousStep = () => {
    if (step === 'faction') {
      setStep('name');
    } else if (step === 'attributes') {
      setStep('faction');
    }
  };

  // Step titles
  const getStepTitle = () => {
    switch (step) {
      case 'name':
        return 'Create Character';
      case 'faction':
        return 'Choose Faction';
      case 'attributes':
        return 'Allocate Attributes';
    }
  };

  // Step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step === 'name' && styles.stepDotActive]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step === 'faction' && styles.stepDotActive]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step === 'attributes' && styles.stepDotActive]} />
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'name':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Character Name</Text>
            <TextInput
              style={[styles.nameInput, nameError ? styles.nameInputError : null]}
              placeholder="Enter character name"
              placeholderTextColor={Colors.textDim}
              value={name}
              onChangeText={handleNameChange}
              maxLength={32}
              autoFocus
            />
            {nameError ? (
              <Text style={styles.errorHelperText}>{nameError}</Text>
            ) : (
              <Text style={styles.helperText}>3-32 characters, letters, numbers, spaces, and basic punctuation</Text>
            )}
          </View>
        );

      case 'faction':
        return (
          <View style={styles.factionSection}>
            <FactionSelectionStep
              selectedFaction={selectedFaction}
              onSelect={setSelectedFaction}
            />
          </View>
        );

      case 'attributes':
        return (
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
                            -
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
        );
    }
  };

  // Render navigation buttons
  const renderNavigation = () => {
    const showBack = step !== 'name';
    const showNext = step !== 'attributes';
    const showCreate = step === 'attributes';

    return (
      <View style={styles.navigationContainer}>
        {showBack && (
          <TouchableOpacity
            style={styles.backNavButton}
            onPress={goToPreviousStep}
          >
            <ChevronLeft size={20} color={Colors.text} />
            <Text style={styles.backNavText}>Back</Text>
          </TouchableOpacity>
        )}

        {!showBack && <View style={styles.navSpacer} />}

        {showNext && (
          <TouchableOpacity
            style={[
              styles.nextButton,
              ((step === 'name' && !canProceedFromName) ||
                (step === 'faction' && !canProceedFromFaction)) &&
                styles.nextButtonDisabled,
            ]}
            onPress={goToNextStep}
            disabled={
              (step === 'name' && !canProceedFromName) ||
              (step === 'faction' && !canProceedFromFaction)
            }
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={20} color={Colors.background} />
          </TouchableOpacity>
        )}

        {showCreate && (
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
        )}
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}

        {createMutation.isError && step === 'attributes' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {createMutation.error?.message || 'Failed to create character'}
            </Text>
          </View>
        )}
      </ScrollView>

      {renderNavigation()}
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  factionSection: {
    flex: 1,
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
  nameInputError: {
    borderColor: Colors.danger,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 8,
  },
  errorHelperText: {
    fontSize: 12,
    color: Colors.danger,
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navSpacer: {
    flex: 1,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backNavText: {
    fontSize: 16,
    color: Colors.text,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
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
