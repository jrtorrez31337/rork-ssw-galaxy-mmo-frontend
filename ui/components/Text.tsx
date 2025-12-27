import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { tokens } from '../theme';

export interface TextProps {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'caption' | 'mono';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: React.ReactNode;
  style?: TextStyle;
}

export function Text({
  variant = 'body',
  weight = 'normal',
  color = tokens.colors.text.primary,
  align = 'left',
  numberOfLines,
  children,
  style,
}: TextProps) {
  const textStyle = [
    styles.base,
    styles[`variant_${variant}`],
    {
      fontWeight: tokens.typography.fontWeight[weight],
      color,
      textAlign: align,
    },
    style,
  ].filter(Boolean);

  return (
    <RNText style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: tokens.colors.text.primary,
  },

  variant_display: {
    fontSize: tokens.typography.fontSize['3xl'],
    lineHeight: tokens.typography.fontSize['3xl'] * tokens.typography.lineHeight.tight,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  variant_title: {
    fontSize: tokens.typography.fontSize['2xl'],
    lineHeight: tokens.typography.fontSize['2xl'] * tokens.typography.lineHeight.tight,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  variant_heading: {
    fontSize: tokens.typography.fontSize.xl,
    lineHeight: tokens.typography.fontSize.xl * tokens.typography.lineHeight.normal,
    fontWeight: tokens.typography.fontWeight.semibold,
  },

  variant_body: {
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.fontSize.base * tokens.typography.lineHeight.normal,
    fontWeight: tokens.typography.fontWeight.normal,
  },

  variant_caption: {
    fontSize: tokens.typography.fontSize.sm,
    lineHeight: tokens.typography.fontSize.sm * tokens.typography.lineHeight.normal,
    fontWeight: tokens.typography.fontWeight.normal,
  },

  variant_mono: {
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.fontSize.base * tokens.typography.lineHeight.normal,
    fontFamily: tokens.typography.fontFamily.mono,
    fontWeight: tokens.typography.fontWeight.normal,
  },
});
