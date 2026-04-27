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
  createInstallment,
  deleteInstallment,
  registerInstallmentPayment,
  toggleInstallmentActive,
  updateInstallment,
} from '../features/installments/installmentRepository';
import { useInstallments } from '../features/installments/useInstallments';
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
  const { installments } = useInstallments();
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
  const [installmentName, setInstallmentName] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('0');
  const [installmentCount, setInstallmentCount] = useState('12');
  const [installmentNextDueDate, setInstallmentNextDueDate] = useState(todayIsoDate());
  const [installmentAccountId, setInstallmentAccountId] = useState(accounts[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');
  const [editingObligationId, setEditingObligationId] = useState<string | null>(null);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  const activeItemsCount =
    obligations.filter((item) => item.status !== 'closed').length +
    subscriptions.filter((item) => item.active).length +
    installments.filter((item) => item.active).length;

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

  const saveInstallment = () => {
    const parsedAmount = Number.parseFloat(installmentAmount.replace(',', '.'));
    const parsedCount = Number.parseInt(installmentCount, 10);

    if (!installmentName.trim()) {
      setFeedback('Inserisci un nome per il piano rateale.');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback('L\'importo rata deve essere valido.');
      return;
    }

    if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
      setFeedback('Il numero totale di rate deve essere un intero maggiore di zero.');
      return;
    }

    if (editingInstallmentId) {
      updateInstallment(database, {
        installmentId: editingInstallmentId,
        name: installmentName,
        installmentAmount: parsedAmount,
        totalInstallments: parsedCount,
        nextDueDate: installmentNextDueDate,
        accountId: installmentAccountId || undefined,
      });
    } else {
      createInstallment(database, {
        name: installmentName,
        installmentAmount: parsedAmount,
        totalInstallments: parsedCount,
        nextDueDate: installmentNextDueDate,
        accountId: installmentAccountId || undefined,
      });
    }

    clearInstallmentForm();
    setFeedback(editingInstallmentId ? 'Piano rateale aggiornato correttamente.' : 'Piano rateale registrato correttamente.');
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

  const handleMarkInstallmentPaid = (installmentId: string) => {
    registerInstallmentPayment(database, { installmentId });
    setFeedback('Rata registrata correttamente.');
    refreshData();
  };

  const handleToggleInstallment = (installmentId: string, active: boolean) => {
    toggleInstallmentActive(database, { installmentId, active: !active });
    setFeedback(active ? 'Piano rateale messo in pausa.' : 'Piano rateale riattivato.');
    refreshData();
  };

  const handleDeleteInstallment = (installmentId: string) => {
    deleteInstallment(database, { installmentId });
    if (editingInstallmentId === installmentId) {
      clearInstallmentForm();
    }
    setFeedback('Piano rateale eliminato.');
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

  const startEditingInstallment = (installmentId: string) => {
    const installment = installments.find((item) => item.id === installmentId);

    if (!installment) {
      return;
    }

    setEditingInstallmentId(installment.id);
    setInstallmentName(installment.name);
    setInstallmentAmount(String(installment.installmentAmount));
    setInstallmentCount(String(installment.totalInstallments));
    setInstallmentNextDueDate(installment.nextDueDate);
    setInstallmentAccountId(installment.accountId ?? '');
    setFeedback('Modifica il piano rateale e salva per aggiornare i dati.');
  };

  const clearInstallmentForm = () => {
    setEditingInstallmentId(null);
    setInstallmentName('');
    setInstallmentAmount('0');
    setInstallmentCount('12');
    setInstallmentNextDueDate(todayIsoDate());
    setInstallmentAccountId(accounts[0]?.id ?? '');
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

      <SectionCard
        title={editingInstallmentId ? 'Modifica piano rateale' : 'Nuovo piano rateale'}
        description="Gestisci acquisti a rate con numero totale rate e avanzamento automatico mensile."
      >
        <TextField label="Nome" onChangeText={setInstallmentName} placeholder="Es. iPhone 15" value={installmentName} />
        <TextField
          label="Importo rata"
          keyboardType="numeric"
          onChangeText={setInstallmentAmount}
          placeholder="0,00"
          value={installmentAmount}
        />
        <TextField
          label="Numero totale rate"
          keyboardType="numeric"
          onChangeText={setInstallmentCount}
          placeholder="12"
          value={installmentCount}
        />
        <TextField
          label="Prossima scadenza"
          onChangeText={setInstallmentNextDueDate}
          placeholder="YYYY-MM-DD"
          value={installmentNextDueDate}
        />
        {accountOptions.length > 0 ? (
          <ChoiceChips
            label="Conto associato"
            onSelect={setInstallmentAccountId}
            options={accountOptions}
            selectedValue={installmentAccountId}
          />
        ) : null}
        <PrimaryButton label={editingInstallmentId ? 'Aggiorna piano rateale' : 'Salva piano rateale'} onPress={saveInstallment} />
        {editingInstallmentId ? (
          <PrimaryButton label="Annulla modifica" onPress={clearInstallmentForm} tone="secondary" />
        ) : null}
      </SectionCard>

      <SectionCard
        title="Piani rateali"
        description="Ogni rinnovo registra una rata, avanza la prossima scadenza e aggiorna il progresso."
      >
        {installments.length > 0 ? (
          installments.map((item) => (
            <View key={item.id} style={styles.moduleCard}>
              <View style={styles.moduleHeaderRow}>
                <View style={styles.moduleTextWrap}>
                  <Text style={styles.moduleTitle}>{item.name}</Text>
                  <Text style={styles.moduleText}>
                    Rata {Math.min(item.paidInstallments + 1, item.totalInstallments)}/{item.totalInstallments} · Prossima data{' '}
                    {formatDate(item.nextDueDate)}
                  </Text>
                </View>
                <Text style={styles.moduleAmount}>{formatCurrency(item.installmentAmount)}</Text>
              </View>
              <Text style={styles.moduleSubtle}>
                Residue: {item.remainingInstallments} · Conto associato: {item.accountName ?? 'Nessuno'}
              </Text>
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEditingInstallment(item.id)} style={styles.inlineAction}>
                  <Text style={styles.inlineActionLabel}>Modifica</Text>
                </Pressable>
                {item.active && item.remainingInstallments > 0 ? (
                  <PrimaryButton label="Segna rata" onPress={() => handleMarkInstallmentPaid(item.id)} tone="secondary" />
                ) : null}
                {item.remainingInstallments > 0 ? (
                  <Pressable onPress={() => handleToggleInstallment(item.id, item.active)} style={styles.inlineAction}>
                    <Text style={styles.inlineActionLabel}>{item.active ? 'Pausa' : 'Riattiva'}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => handleDeleteInstallment(item.id)} style={styles.inlineDangerAction}>
                  <Text style={styles.inlineDangerLabel}>Elimina</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.moduleText}>Nessun piano rateale registrato per ora.</Text>
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