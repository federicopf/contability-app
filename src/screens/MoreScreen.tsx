import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ChoiceChips } from '../components/ChoiceChips';
import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { TextField } from '../components/TextField';
import { useDatabase } from '../db/DatabaseProvider';
import { useAccounts } from '../features/accounts/useAccounts';
import {
  createObligation,
  deleteObligation,
  updateObligation,
} from '../features/obligations/obligationRepository';
import { useObligations } from '../features/obligations/useObligations';
import {
  createSubscription,
  deleteSubscription,
  renewSubscription,
  toggleSubscriptionActive,
  updateSubscription,
} from '../features/subscriptions/subscriptionRepository';
import { useSubscriptions } from '../features/subscriptions/useSubscriptions';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { ObligationType, SubscriptionFrequency } from '../types/domain';
import { todayIsoDate } from '../utils/date';
import {
  formatCurrency,
  formatDate,
  formatObligationType,
  formatSubscriptionFrequency,
} from '../utils/format';

const obligationTypeOptions: Array<{ label: string; value: ObligationType }> = [
  { label: 'Debito', value: 'debt' },
  { label: 'Credito', value: 'credit' },
];

const subscriptionFrequencyOptions: Array<{ label: string; value: SubscriptionFrequency }> = [
  { label: 'Settimanale', value: 'weekly' },
  { label: 'Mensile', value: 'monthly' },
  { label: 'Trimestrale', value: 'quarterly' },
  { label: 'Annuale', value: 'yearly' },
];

export function MoreScreen() {
  const { database, refreshData } = useDatabase();
  const { accounts } = useAccounts();
  const { obligations } = useObligations();
  const { subscriptions } = useSubscriptions();
  const [obligationType, setObligationType] = useState<ObligationType>('debt');
  const [obligationStatus, setObligationStatus] = useState<'open' | 'closed'>('open');
  const [counterparty, setCounterparty] = useState('');
  const [obligationAmount, setObligationAmount] = useState('0');
  const [obligationDueAt, setObligationDueAt] = useState(todayIsoDate());
  const [subscriptionName, setSubscriptionName] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('0');
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<SubscriptionFrequency>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(todayIsoDate());
  const [subscriptionAccountId, setSubscriptionAccountId] = useState(accounts[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');
  const [editingObligationId, setEditingObligationId] = useState<string | null>(null);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  const activeItemsCount = obligations.filter((item) => item.status !== 'closed').length + subscriptions.filter((item) => item.active).length;

  const saveObligation = () => {
    const parsedAmount = Number.parseFloat(obligationAmount.replace(',', '.'));

    if (!counterparty.trim()) {
      setFeedback('Inserisci la controparte del debito o credito.');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback('L\'importo di debito o credito deve essere valido.');
      return;
    }

    if (editingObligationId) {
      updateObligation(database, {
        obligationId: editingObligationId,
        type: obligationType,
        counterparty,
        amount: parsedAmount,
        dueAt: obligationDueAt,
        status: obligationStatus,
      });
    } else {
      createObligation(database, {
        type: obligationType,
        counterparty,
        amount: parsedAmount,
        dueAt: obligationDueAt,
        status: obligationStatus,
      });
    }

    setCounterparty('');
    setObligationAmount('0');
    setObligationDueAt(todayIsoDate());
    setObligationStatus('open');
    setEditingObligationId(null);
    setFeedback(editingObligationId ? 'Debito o credito aggiornato correttamente.' : 'Debito o credito salvato correttamente.');
    refreshData();
  };

  const saveSubscription = () => {
    const parsedAmount = Number.parseFloat(subscriptionAmount.replace(',', '.'));

    if (!subscriptionName.trim()) {
      setFeedback('Inserisci il nome dell\'abbonamento.');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback('L\'importo dell\'abbonamento deve essere valido.');
      return;
    }

    if (editingSubscriptionId) {
      updateSubscription(database, {
        subscriptionId: editingSubscriptionId,
        name: subscriptionName,
        amount: parsedAmount,
        frequency: subscriptionFrequency,
        nextBillingDate,
        accountId: subscriptionAccountId || undefined,
      });
    } else {
      createSubscription(database, {
        name: subscriptionName,
        amount: parsedAmount,
        frequency: subscriptionFrequency,
        nextBillingDate,
        accountId: subscriptionAccountId || undefined,
      });
    }

    setSubscriptionName('');
    setSubscriptionAmount('0');
    setSubscriptionFrequency('monthly');
    setNextBillingDate(todayIsoDate());
    setEditingSubscriptionId(null);
    setFeedback(editingSubscriptionId ? 'Abbonamento aggiornato correttamente.' : 'Abbonamento registrato correttamente.');
    refreshData();
  };

  const handleRenewSubscription = (subscriptionId: string) => {
    renewSubscription(database, { subscriptionId });
    setFeedback('Rinnovo registrato e prossima scadenza aggiornata.');
    refreshData();
  };

  const handleDeleteObligation = (obligationId: string) => {
    deleteObligation(database, { obligationId });
    if (editingObligationId === obligationId) {
      clearObligationForm();
    }
    setFeedback('Debito o credito eliminato.');
    refreshData();
  };

  const handleToggleSubscription = (subscriptionId: string, active: boolean) => {
    toggleSubscriptionActive(database, { subscriptionId, active: !active });
    setFeedback(active ? 'Abbonamento messo in pausa.' : 'Abbonamento riattivato.');
    refreshData();
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    deleteSubscription(database, { subscriptionId });
    if (editingSubscriptionId === subscriptionId) {
      clearSubscriptionForm();
    }
    setFeedback('Abbonamento eliminato.');
    refreshData();
  };

  const startEditingObligation = (obligationId: string) => {
    const obligation = obligations.find((item) => item.id === obligationId);

    if (!obligation) {
      return;
    }

    setEditingObligationId(obligation.id);
    setObligationType(obligation.type);
    setObligationStatus(obligation.status);
    setCounterparty(obligation.counterparty);
    setObligationAmount(String(obligation.amount));
    setObligationDueAt(obligation.dueAt);
    setFeedback('Modifica il debito o credito e salva per aggiornare i dati.');
  };

  const clearObligationForm = () => {
    setEditingObligationId(null);
    setObligationType('debt');
    setObligationStatus('open');
    setCounterparty('');
    setObligationAmount('0');
    setObligationDueAt(todayIsoDate());
    setFeedback('');
  };

  const startEditingSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find((item) => item.id === subscriptionId);

    if (!subscription) {
      return;
    }

    setEditingSubscriptionId(subscription.id);
    setSubscriptionName(subscription.name);
    setSubscriptionAmount(String(subscription.amount));
    setSubscriptionFrequency(subscription.frequency);
    setNextBillingDate(subscription.nextBillingDate);
    setSubscriptionAccountId(subscription.accountId ?? '');
    setFeedback('Modifica l\'abbonamento e salva per aggiornare i dati.');
  };

  const clearSubscriptionForm = () => {
    setEditingSubscriptionId(null);
    setSubscriptionName('');
    setSubscriptionAmount('0');
    setSubscriptionFrequency('monthly');
    setNextBillingDate(todayIsoDate());
    setSubscriptionAccountId(accounts[0]?.id ?? '');
    setFeedback('');
  };

  return (
    <AppScreen
      eyebrow="Altro"
      title="Scadenze e impegni sotto controllo"
      description="Debiti, crediti e abbonamenti sono ora operativi in locale, con scadenze chiare, rinnovi rapidi e stato sempre leggibile."
      hero={
        <InfoCard
          title="Promemoria attivi"
          subtitle="Somma di obbligazioni aperte e abbonamenti attivi"
          value={`${activeItemsCount} elementi`}
        />
      }
    >
      <SectionCard
        title={editingObligationId ? 'Modifica debito o credito' : 'Nuovo debito o credito'}
        description="Registra somme da pagare o da ricevere, con scadenza e stato semplice aperta o chiusa."
      >
        <ChoiceChips label="Tipo" onSelect={setObligationType} options={obligationTypeOptions} selectedValue={obligationType} />
        <ChoiceChips
          label="Stato"
          onSelect={(value) => setObligationStatus(value as 'open' | 'closed')}
          options={[
            { label: 'Aperta', value: 'open' },
            { label: 'Chiusa', value: 'closed' },
          ]}
          selectedValue={obligationStatus}
        />
        <TextField label="Controparte" onChangeText={setCounterparty} placeholder="Es. Marco Rossi" value={counterparty} />
        <TextField label="Importo" keyboardType="numeric" onChangeText={setObligationAmount} placeholder="0,00" value={obligationAmount} />
        <TextField label="Scadenza" onChangeText={setObligationDueAt} placeholder="YYYY-MM-DD" value={obligationDueAt} />
        <PrimaryButton
          label={editingObligationId ? 'Aggiorna debito o credito' : 'Salva debito o credito'}
          onPress={saveObligation}
        />
        {editingObligationId ? <PrimaryButton label="Annulla modifica" onPress={clearObligationForm} tone="secondary" /> : null}
      </SectionCard>

      <SectionCard
        title="Elenco debiti e crediti"
        description="Ogni voce mostra importo totale, scadenza e stato corrente."
      >
        {obligations.length > 0 ? (
          obligations.map((item) => (
            <View key={item.id} style={styles.moduleCard}>
              <View style={styles.moduleHeaderRow}>
                <View style={styles.moduleTextWrap}>
                  <Text style={styles.moduleTitle}>{item.counterparty}</Text>
                  <Text style={styles.moduleText}>
                    {formatObligationType(item.type)} · Scade il {formatDate(item.dueAt)} · Stato {item.status}
                  </Text>
                </View>
                <Text style={styles.moduleAmount}>{formatCurrency(item.amount)}</Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEditingObligation(item.id)} style={styles.inlineAction}>
                  <Text style={styles.inlineActionLabel}>Modifica</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteObligation(item.id)} style={styles.inlineDangerAction}>
                  <Text style={styles.inlineDangerLabel}>Elimina</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.moduleText}>Nessun debito o credito registrato per ora.</Text>
        )}
      </SectionCard>

      <SectionCard
        title={editingSubscriptionId ? 'Modifica abbonamento' : 'Nuovo abbonamento'}
        description="Registra la ricorrenza e, se vuoi, associa un conto: al rinnovo verra creato anche il movimento di spesa."
      >
        <TextField label="Nome" onChangeText={setSubscriptionName} placeholder="Es. Netflix" value={subscriptionName} />
        <TextField label="Importo" keyboardType="numeric" onChangeText={setSubscriptionAmount} placeholder="0,00" value={subscriptionAmount} />
        <TextField label="Prossima scadenza" onChangeText={setNextBillingDate} placeholder="YYYY-MM-DD" value={nextBillingDate} />
        <ChoiceChips
          label="Frequenza"
          onSelect={setSubscriptionFrequency}
          options={subscriptionFrequencyOptions}
          selectedValue={subscriptionFrequency}
        />
        {accountOptions.length > 0 ? (
          <ChoiceChips
            label="Conto associato"
            onSelect={setSubscriptionAccountId}
            options={accountOptions}
            selectedValue={subscriptionAccountId}
          />
        ) : null}
        <PrimaryButton label={editingSubscriptionId ? 'Aggiorna abbonamento' : 'Salva abbonamento'} onPress={saveSubscription} />
        {editingSubscriptionId ? <PrimaryButton label="Annulla modifica" onPress={clearSubscriptionForm} tone="secondary" /> : null}
      </SectionCard>

      <SectionCard
        title="Abbonamenti attivi"
        description="Il rinnovo sposta avanti la data e, se il conto e associato, registra anche la spesa nel ledger."
      >
        {subscriptions.length > 0 ? (
          subscriptions.map((item) => (
            <View key={item.id} style={styles.moduleCard}>
              <View style={styles.moduleHeaderRow}>
                <View style={styles.moduleTextWrap}>
                  <Text style={styles.moduleTitle}>{item.name}</Text>
                  <Text style={styles.moduleText}>
                    {formatSubscriptionFrequency(item.frequency)} · Prossima data {formatDate(item.nextBillingDate)}
                  </Text>
                </View>
                <Text style={styles.moduleAmount}>{formatCurrency(item.amount)}</Text>
              </View>
              <Text style={styles.moduleSubtle}>Conto associato: {item.accountName ?? 'Nessuno'}</Text>
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEditingSubscription(item.id)} style={styles.inlineAction}>
                  <Text style={styles.inlineActionLabel}>Modifica</Text>
                </Pressable>
                {item.active ? <PrimaryButton label="Segna rinnovo" onPress={() => handleRenewSubscription(item.id)} tone="secondary" /> : null}
                <Pressable onPress={() => handleToggleSubscription(item.id, item.active)} style={styles.inlineAction}>
                  <Text style={styles.inlineActionLabel}>{item.active ? 'Pausa' : 'Riattiva'}</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteSubscription(item.id)} style={styles.inlineDangerAction}>
                  <Text style={styles.inlineDangerLabel}>Elimina</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.moduleText}>Nessun abbonamento registrato per ora.</Text>
        )}
      </SectionCard>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
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
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  moduleTextWrap: {
    flex: 1,
    gap: 4,
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
  moduleSubtle: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  moduleAmount: {
    fontFamily: typography.title,
    fontSize: 18,
    color: colors.textPrimary,
    alignSelf: 'center',
  },
  feedback: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.success,
  },
  rowActions: {
    gap: 8,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
  },
  inlineActionLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.textPrimary,
  },
  inlineDangerAction: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  inlineDangerLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.danger,
  },
});