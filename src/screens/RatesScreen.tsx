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
import { colors, radius, spacing, typography } from '../theme/tokens';
import { todayIsoDate } from '../utils/date';
import { formatCurrency, formatDate } from '../utils/format';

export function RatesScreen() {
  const { database, refreshData } = useDatabase();
  const { accounts } = useAccounts();
  const { installments } = useInstallments();
  const [cashflowType, setCashflowType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('0');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [nextDueDate, setNextDueDate] = useState(todayIsoDate());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  const activeRatesCount = installments.filter((item) => item.active).length;

  const saveRate = () => {
    const parsedAmount = Number.parseFloat(installmentAmount.replace(',', '.'));
    const parsedCount = Number.parseInt(totalInstallments, 10);

    if (!name.trim()) {
      setFeedback('Inserisci un nome per la rata.');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback('L\'importo rata deve essere valido.');
      return;
    }

    if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
      setFeedback('Il numero totale rate deve essere un intero maggiore di zero.');
      return;
    }

    if (editingInstallmentId) {
      updateInstallment(database, {
        installmentId: editingInstallmentId,
        name,
        cashflowType,
        installmentAmount: parsedAmount,
        totalInstallments: parsedCount,
        nextDueDate,
        accountId: accountId || undefined,
      });
    } else {
      createInstallment(database, {
        name,
        cashflowType,
        installmentAmount: parsedAmount,
        totalInstallments: parsedCount,
        nextDueDate,
        accountId: accountId || undefined,
      });
    }

    clearForm();
    setFeedback(editingInstallmentId ? 'Rata aggiornata.' : 'Rata salvata.');
    refreshData();
  };

  const startEditing = (installmentId: string) => {
    const item = installments.find((installment) => installment.id === installmentId);

    if (!item) {
      return;
    }

    setEditingInstallmentId(item.id);
    setCashflowType(item.cashflowType);
    setName(item.name);
    setInstallmentAmount(String(item.installmentAmount));
    setTotalInstallments(String(item.totalInstallments));
    setNextDueDate(item.nextDueDate);
    setAccountId(item.accountId ?? '');
    setFeedback('Modifica la rata e salva per aggiornare i dati.');
  };

  const clearForm = () => {
    setEditingInstallmentId(null);
    setCashflowType('expense');
    setName('');
    setInstallmentAmount('0');
    setTotalInstallments('12');
    setNextDueDate(todayIsoDate());
    setAccountId(accounts[0]?.id ?? '');
  };

  const markInstallment = (installmentId: string) => {
    registerInstallmentPayment(database, { installmentId });
    setFeedback('Rata registrata.');
    refreshData();
  };

  const toggleRate = (installmentId: string, active: boolean) => {
    toggleInstallmentActive(database, { installmentId, active: !active });
    setFeedback(active ? 'Rata messa in pausa.' : 'Rata riattivata.');
    refreshData();
  };

  const removeRate = (installmentId: string) => {
    deleteInstallment(database, { installmentId });
    if (editingInstallmentId === installmentId) {
      clearForm();
    }
    setFeedback('Rata eliminata.');
    refreshData();
  };

  return (
    <AppScreen
      eyebrow="Rate"
      title="Entrate e uscite ricorrenti"
      description="Gestisci cashflow rateale con progressivo, scadenze e registrazione automatica del movimento."
      hero={<InfoCard title="Rate attive" subtitle="Piani attivi in questo momento" value={`${activeRatesCount}`} tone="strong" />}
    >
      <SectionCard title={editingInstallmentId ? 'Modifica rata' : 'Nuova rata'} description="Le rate possono essere entrate o uscite e avanzano a ogni registrazione.">
        <ChoiceChips
          label="Tipo cashflow"
          onSelect={(value) => setCashflowType(value as 'income' | 'expense')}
          options={[
            { label: 'Entrata', value: 'income' },
            { label: 'Uscita', value: 'expense' },
          ]}
          selectedValue={cashflowType}
        />
        <TextField label="Nome" onChangeText={setName} placeholder="Es. Rimborso auto" value={name} />
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
          onChangeText={setTotalInstallments}
          placeholder="12"
          value={totalInstallments}
        />
        <TextField label="Prossima scadenza" onChangeText={setNextDueDate} placeholder="YYYY-MM-DD" value={nextDueDate} />
        {accountOptions.length > 0 ? (
          <ChoiceChips label="Conto associato" onSelect={setAccountId} options={accountOptions} selectedValue={accountId} />
        ) : null}
        <PrimaryButton label={editingInstallmentId ? 'Aggiorna rata' : 'Salva rata'} onPress={saveRate} />
        {editingInstallmentId ? <PrimaryButton label="Annulla modifica" onPress={clearForm} tone="secondary" /> : null}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </SectionCard>

      <SectionCard title="Elenco rate" description="Segna rata quando incassi o paghi: il piano avanza automaticamente.">
        {installments.length > 0 ? (
          installments.map((item) => (
            <View key={item.id} style={styles.rateRow}>
              <View style={styles.rateText}>
                <Text style={styles.rateTitle}>{item.name}</Text>
                <Text style={styles.rateMeta}>
                  {item.cashflowType === 'income' ? 'Entrata' : 'Uscita'} · Rata {Math.min(item.paidInstallments + 1, item.totalInstallments)}/
                  {item.totalInstallments} · Scade il {formatDate(item.nextDueDate)}
                </Text>
                <Text style={styles.rateMeta}>Residue: {item.remainingInstallments} · Conto: {item.accountName ?? 'Nessuno'}</Text>
              </View>
              <View style={styles.rateAside}>
                <Text style={styles.rateAmount}>{formatCurrency(item.installmentAmount)}</Text>
                <Pressable onPress={() => startEditing(item.id)} style={styles.inlineAction}>
                  <Text style={styles.inlineActionLabel}>Modifica</Text>
                </Pressable>
                {item.active && item.remainingInstallments > 0 ? (
                  <PrimaryButton label="Segna rata" onPress={() => markInstallment(item.id)} tone="secondary" />
                ) : null}
                {item.remainingInstallments > 0 ? (
                  <Pressable onPress={() => toggleRate(item.id, item.active)} style={styles.inlineAction}>
                    <Text style={styles.inlineActionLabel}>{item.active ? 'Pausa' : 'Riattiva'}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => removeRate(item.id)} style={styles.inlineDangerAction}>
                  <Text style={styles.inlineDangerLabel}>Elimina</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.rateMeta}>Nessuna rata registrata per ora.</Text>
        )}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  rateRow: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rateText: {
    flex: 1,
    gap: 4,
  },
  rateTitle: {
    fontFamily: typography.title,
    fontSize: 18,
    color: colors.textPrimary,
  },
  rateMeta: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  rateAside: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  rateAmount: {
    fontFamily: typography.title,
    fontSize: 18,
    color: colors.textPrimary,
  },
  feedback: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.success,
  },
  inlineAction: {
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