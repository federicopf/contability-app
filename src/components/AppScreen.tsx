import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme/tokens';

type AppScreenProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  hero?: ReactNode;
}>;

export function AppScreen({ eyebrow, title, description, hero, children }: AppScreenProps) {
  return (
    <LinearGradient colors={[colors.canvas, '#f3e8d6']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          {hero}
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    maxWidth: 520,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});