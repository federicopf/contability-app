import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { InfoCard } from '../components/InfoCard';
import { colors, radius, spacing, typography } from '../theme/tokens';

const stats = [
  { title: 'Entrate', value: '€ 2.840,00' },
  { title: 'Uscite', value: '€ 1.420,00' },
  { title: 'Netto', value: '€ 1.420,00' },
];

export function StatisticsScreen() {
  return (
    <AppScreen
      eyebrow="Statistiche"
      title="Numeri leggibili in un colpo d'occhio"
      description="La dashboard dovra restare elegante ma soprattutto utile: periodo chiaro, indicatori netti e grafici facili da leggere su mobile."
      hero={<InfoCard title="Mese corrente" subtitle="Bozza visuale della sezione analitica" value="+ 12,4%" tone="strong" />}
    >
      <View style={styles.statsGrid}>
        {stats.map((item) => (
          <View key={item.title} style={styles.statTile}>
            <Text style={styles.statTitle}>{item.title}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <InfoCard
        title="Roadmap analitica"
        subtitle="Prossimi step: aggregazioni reali da SQLite, filtri periodo, categorie, conti e visualizzazioni grafiche."
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    gap: spacing.md,
  },
  statTile: {
    backgroundColor: colors.panelMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
  },
  statTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 15,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: typography.display,
    fontSize: 26,
    color: colors.textPrimary,
  },
});