import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { InfoCard } from '../components/InfoCard';
import { colors, radius, spacing, typography } from '../theme/tokens';

const modules = [
  { title: 'Debiti e crediti', text: 'Tracciamento di somme da ricevere o pagare, con scadenze e stati.' },
  { title: 'Abbonamenti', text: 'Ricorrenze mensili o annuali con costo totale e prossima scadenza.' },
];

export function MoreScreen() {
  return (
    <AppScreen
      eyebrow="Altro"
      title="Scadenze e impegni sotto controllo"
      description="Qui confluiranno i moduli complementari: debiti, crediti e abbonamenti, tutti con una UX semplice e leggibile anche nell'uso quotidiano."
      hero={<InfoCard title="Promemoria attivi" subtitle="Elementi che richiedono attenzione nei prossimi 30 giorni" value="5 elementi" />}
    >
      {modules.map((module) => (
        <View key={module.title} style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleText}>{module.text}</Text>
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  moduleCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  moduleTitle: {
    fontFamily: typography.title,
    fontSize: 18,
    color: colors.textPrimary,
  },
  moduleText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});