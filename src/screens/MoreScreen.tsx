import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { SectionCard } from '../components/SectionCard';
import { InfoCard } from '../components/InfoCard';
import { colors, typography } from '../theme/tokens';

export function MoreScreen() {
  return (
    <AppScreen
      eyebrow="Altro"
      title="Sezione non utilizzata"
      description="La navigazione attiva usa solo Conti, Rate e Statistiche."
      hero={
        <InfoCard
          title="Menu semplificato"
          subtitle="Usa la barra in basso per entrare nelle sezioni operative"
          value="Conti · Rate · Statistiche"
        />
      }
    >
      <SectionCard title="Aggiornamento interfaccia" description="Questa schermata rimane solo per compatibilita con il codice esistente.">
        <Text style={styles.moduleText}>Le funzionalita sono state spostate nelle tre sezioni principali del menu.</Text>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  moduleText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});