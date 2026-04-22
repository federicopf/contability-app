import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type InfoCardProps = {
  title: string;
  subtitle: string;
  value?: string;
  tone?: 'default' | 'strong';
  children?: ReactNode;
};

export function InfoCard({ title, subtitle, value, tone = 'default', children }: InfoCardProps) {
  const isStrong = tone === 'strong';

  return (
    <View style={[styles.card, isStrong ? styles.cardStrong : styles.cardDefault]}>
      <View style={styles.header}>
        <Text style={[styles.title, isStrong ? styles.inverse : styles.defaultText]}>{title}</Text>
        <Text style={[styles.subtitle, isStrong ? styles.inverseMuted : styles.muted]}>{subtitle}</Text>
      </View>
      {value ? <Text style={[styles.value, isStrong ? styles.inverse : styles.defaultText]}>{value}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    gap: spacing.md,
  },
  cardDefault: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
  },
  cardStrong: {
    backgroundColor: colors.panelStrong,
    borderColor: 'transparent',
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: typography.bodyStrong,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
  },
  value: {
    fontFamily: typography.display,
    fontSize: 28,
  },
  defaultText: {
    color: colors.textPrimary,
  },
  muted: {
    color: colors.textSecondary,
  },
  inverse: {
    color: colors.textInverse,
  },
  inverseMuted: {
    color: 'rgba(255, 253, 248, 0.76)',
  },
});