import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { tokens } from '../theme';

export interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={48} color={tokens.colors.text.tertiary} />
      <Text variant="heading" weight="semibold" color={tokens.colors.text.secondary} style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color={tokens.colors.text.tertiary} align="center" style={styles.description}>
        {description}
      </Text>
      {action && (
        <View style={styles.action}>
          <Button variant="secondary" onPress={action.onPress}>
            {action.label}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[8],
  },

  title: {
    marginTop: tokens.spacing[4],
  },

  description: {
    marginTop: tokens.spacing[2],
    maxWidth: 320,
  },

  action: {
    marginTop: tokens.spacing[6],
  },
});
