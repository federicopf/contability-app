import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { InfoCard } from '../components/InfoCard';
import { SectionCard } from '../components/SectionCard';
import { useStatistics } from '../features/statistics/useStatistics';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { formatCurrency } from '../utils/format';

export function StatisticsScreen() {
  const { currentMonth, previousMonth, currentYear, topExpenseCategories, accountBalances } = useStatistics();
  const highestCategoryValue = topExpenseCategories[0]?.total ?? 0;
  const highestAccountBalance = accountBalances[0]?.balance ?? 0;
  const trendDelta = currentMonth.net - previousMonth.net;
  const trendLabel = trendDelta >= 0 ? 'In crescita' : 'In flessione';

  return (
    <AppScreen
      eyebrow="Statistiche"
      title="Numeri leggibili in un colpo d'occhio"
      description="La dashboard ora legge direttamente il database locale e riassume entrate, uscite, netto e distribuzione dei saldi senza passaggi manuali."
      hero={
        <InfoCard
          title="Mese corrente"
          subtitle={`${currentMonth.transactionsCount} movimenti registrati · ${trendLabel}`}
          value={formatCurrency(currentMonth.net)}
          tone="strong"
        />
      }
    >
      <View style={styles.statsGrid}>
        {[
          { title: 'Entrate mese', value: formatCurrency(currentMonth.income) },
          { title: 'Uscite mese', value: formatCurrency(currentMonth.expense) },
          { title: 'Netto anno', value: formatCurrency(currentYear.net) },
        ].map((item) => (
          <View key={item.title} style={styles.statTile}>
            <Text style={styles.statTitle}>{item.title}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <SectionCard
        title="Confronto periodi"
        description="Un colpo d'occhio sui periodi principali, utile per leggere l'andamento senza aprire filtri complessi."
      >
        <View style={styles.trendBanner}>
          <Text style={styles.trendTitle}>{trendLabel}</Text>
          <Text style={styles.trendValue}>{`${trendDelta >= 0 ? '+' : ''}${formatCurrency(trendDelta)}`}</Text>
        </View>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Mese corrente</Text>
          <Text style={styles.comparisonValue}>{formatCurrency(currentMonth.net)}</Text>
        </View>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Mese precedente</Text>
          <Text style={styles.comparisonValue}>{formatCurrency(previousMonth.net)}</Text>
        </View>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Anno corrente</Text>
          <Text style={styles.comparisonValue}>{formatCurrency(currentYear.net)}</Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Categorie di spesa top"
        description="Le cinque categorie che stanno assorbendo piu spesa nel mese corrente."
      >
        {topExpenseCategories.length > 0 ? (
          topExpenseCategories.map((item) => (
            <View key={item.category} style={styles.chartItem}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>{item.category}</Text>
                <Text style={styles.comparisonValue}>{formatCurrency(item.total)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    styles.expenseBar,
                    { width: `${Math.max((item.total / Math.max(highestCategoryValue, 1)) * 100, 8)}%` },
                  ]}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nessuna spesa registrata nel mese corrente.</Text>
        )}
      </SectionCard>

      <SectionCard
        title="Distribuzione saldi per conto"
        description="Il peso dei diversi conti sul patrimonio disponibile al momento."
      >
        {accountBalances.map((item) => (
          <View key={item.accountName} style={styles.chartItem}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>{item.accountName}</Text>
              <Text style={styles.comparisonValue}>{formatCurrency(item.balance)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  styles.balanceBar,
                  { width: `${Math.max((Math.abs(item.balance) / Math.max(Math.abs(highestAccountBalance), 1)) * 100, 8)}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </SectionCard>
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
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  comparisonLabel: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  comparisonValue: {
    fontFamily: typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  trendBanner: {
    backgroundColor: colors.panelMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  trendTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 14,
    color: colors.textSecondary,
  },
  trendValue: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.textPrimary,
  },
  chartItem: {
    gap: 8,
  },
  barTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.panelMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  expenseBar: {
    backgroundColor: colors.accent,
  },
  balanceBar: {
    backgroundColor: colors.panelStrong,
  },
});