import React from 'react';
import { View, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { Text, Card } from './';
import { tokens } from '../theme';
import type { Character } from '@/types/api';

interface CharacterCardProps {
  character: Character;
}

export const CharacterCard = React.memo(function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Card variant="default" padding={4}>
      <View style={styles.header}>
        <User size={20} color={tokens.colors.primary.main} />
        <Text variant="heading" weight="bold">
          {character.name}
        </Text>
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
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
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
