import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Edit2 } from 'lucide-react-native';
import { Text } from './Text';
import { Card } from './Card';
import { tokens } from '../theme';
import type { Character } from '@/types/api';

interface CharacterCardProps {
  character: Character;
  onEdit?: (character: Character) => void;
}

export const CharacterCard = React.memo(function CharacterCard({ character, onEdit }: CharacterCardProps) {
  const attributesSummary = `Piloting ${character.attributes.piloting}, Engineering ${character.attributes.engineering}, Science ${character.attributes.science}, Tactics ${character.attributes.tactics}, Leadership ${character.attributes.leadership}`;

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Character ${character.name} from ${character.home_sector}. ${attributesSummary}`}
    >
      <Card variant="default" padding={4}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <User size={20} color={tokens.colors.primary.main} />
            <Text variant="heading" weight="bold">
              {character.name}
            </Text>
          </View>
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(character)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Edit ${character.name}`}
              accessibilityHint="Opens character edit panel"
            >
              <Edit2 size={16} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

      <Text variant="body" color={tokens.colors.text.secondary} style={styles.sector}>
        Home Sector: {character.home_sector}
      </Text>

      <View style={styles.attributes}>
        <View style={styles.attributeRow}>
          <View style={styles.attribute}>
            <Text variant="caption" color={tokens.colors.text.secondary}>
              Piloting
            </Text>
            <Text variant="body" weight="semibold" color={tokens.colors.primary.main}>
              {character.attributes.piloting}
            </Text>
          </View>
          <View style={styles.attribute}>
            <Text variant="caption" color={tokens.colors.text.secondary}>
              Engineering
            </Text>
            <Text variant="body" weight="semibold" color={tokens.colors.primary.main}>
              {character.attributes.engineering}
            </Text>
          </View>
          <View style={styles.attribute}>
            <Text variant="caption" color={tokens.colors.text.secondary}>
              Science
            </Text>
            <Text variant="body" weight="semibold" color={tokens.colors.primary.main}>
              {character.attributes.science}
            </Text>
          </View>
        </View>
        <View style={styles.attributeRow}>
          <View style={styles.attribute}>
            <Text variant="caption" color={tokens.colors.text.secondary}>
              Tactics
            </Text>
            <Text variant="body" weight="semibold" color={tokens.colors.primary.main}>
              {character.attributes.tactics}
            </Text>
          </View>
          <View style={styles.attribute}>
            <Text variant="caption" color={tokens.colors.text.secondary}>
              Leadership
            </Text>
            <Text variant="body" weight="semibold" color={tokens.colors.primary.main}>
              {character.attributes.leadership}
            </Text>
          </View>
        </View>
      </View>
      </Card>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[1],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.base,
    backgroundColor: tokens.colors.surface.raised,
  },
  sector: {
    marginBottom: tokens.spacing[3],
  },
  attributes: {
    gap: tokens.spacing[2],
  },
  attributeRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  attribute: {
    flex: 1,
    backgroundColor: tokens.colors.surface.raised,
    padding: tokens.spacing[2],
    borderRadius: tokens.radius.base,
    alignItems: 'center',
  },
});
