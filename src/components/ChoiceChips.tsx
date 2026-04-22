import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type ChoiceChipOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type ChoiceChipsProps<TValue extends string> = {
  label: string;
  options: ChoiceChipOption<TValue>[];
  selectedValue: TValue;
  onSelect: (value: TValue) => void;
};

export function ChoiceChips<TValue extends string>({
  label,
  options,
  selectedValue,
  onSelect,
}: ChoiceChipsProps<TValue>) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const isActive = option.value === selectedValue;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => onSelect(option.value)}
              style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
            >
              <Text style={[styles.chipLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  activeChip: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.panelStrong,
  },
  inactiveChip: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
  },
  chipLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
  },
  activeLabel: {
    color: colors.textInverse,
  },
  inactiveLabel: {
    color: colors.textPrimary,
  },
});