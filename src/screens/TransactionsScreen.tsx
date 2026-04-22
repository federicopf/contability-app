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
import { createTransaction, deleteTransaction, updateTransaction } from '../features/transactions/transactionRepository';
import { useTransactions } from '../features/transactions/useTransactions';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { TransactionType } from '../types/domain';
import { todayIsoDate } from '../utils/date';
import { formatCurrency, formatDate, formatTransactionType } from '../utils/format';

const transactionTypeOptions: Array<{ label: string; value: TransactionType }> = [
  { label: 'Entrata', value: 'income' },
  { label: 'Uscita', value: 'expense' },
  { label: 'Trasferimento', value: 'transfer' },
];

const transactionFilterOptions = [
  { label: 'Tutti', value: 'all' },
  { label: 'Entrate', value: 'income' },
  { label: 'Uscite', value: 'expense' },
  { label: 'Trasferimenti', value: 'transfer' },
] as const;

export function TransactionsScreen() {
  const { database, refreshData } = useDatabase();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [bookedAt, setBookedAt] = useState(todayIsoDate());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [relatedAccountId, setRelatedAccountId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingTransferGroupId, setEditingTransferGroupId] = useState<string | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<(typeof transactionFilterOptions)[number]['value']>('all');
  const [activeAccountFilter, setActiveAccountFilter] = useState('all');

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  const filterAccountOptions = useMemo(
    () => [{ label: 'Tutti i conti', value: 'all' }, ...accountOptions],
    [accountOptions],
  );

  const targetAccountOptions = useMemo(
    () => accountOptions.filter((option) => option.value !== accountId),
    [accountId, accountOptions],
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesType = activeTypeFilter === 'all' || transaction.type === activeTypeFilter;
        const matchesAccount = activeAccountFilter === 'all' || transaction.accountId === activeAccountFilter;

        return matchesType && matchesAccount;
      }),
    [activeAccountFilter, activeTypeFilter, transactions],
  );

  const saveTransaction = () => {
    const parsedAmount = Number.parseFloat(amount.replace(',', '.'));

    if (!accountId) {
      setFeedback('Crea o seleziona prima un conto.');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback('L\'importo deve essere maggiore di zero.');
      return;
    }

    if (!description.trim()) {
      setFeedback('Inserisci una descrizione del movimento.');
      return;
    }

    if (type === 'transfer' && !relatedAccountId) {
      setFeedback('Per un trasferimento serve anche il conto di destinazione.');
      return;
    }

    if (editingTransactionId) {
      updateTransaction(database, {
        id: editingTransactionId,
        transferGroupId: editingTransferGroupId,
        type,
        amount: parsedAmount,
        category,
        description,
        bookedAt,
        accountId,
        relatedAccountId: type === 'transfer' ? relatedAccountId : undefined,
      });
    } else {
      createTransaction(database, {
        type,
        amount: parsedAmount,
        category,
        description,
        bookedAt,
        accountId,
        relatedAccountId: type === 'transfer' ? relatedAccountId : undefined,
      });
    }

    setAmount('0');
    setDescription('');
    setCategory('');
    setBookedAt(todayIsoDate());
    setRelatedAccountId('');
    setEditingTransactionId(null);
    setEditingTransferGroupId(null);
    setFeedback(editingTransactionId ? 'Movimento aggiornato correttamente.' : 'Movimento registrato correttamente.');
    refreshData();
  };

  const startEditingTransaction = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction) {
      return;
    }

    const derivedType: TransactionType = transaction.transferGroupId ? 'transfer' : transaction.type;

    setEditingTransactionId(transaction.id);
    setEditingTransferGroupId(transaction.transferGroupId);
    setType(derivedType);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setCategory(transaction.transferGroupId ? 'Trasferimento' : transaction.category);
    setBookedAt(transaction.bookedAt);
    setAccountId(transaction.accountId);
    const destinationAccount =
      transaction.transferGroupId && transaction.relatedAccountName
        ? accounts.find((item) => item.name === transaction.relatedAccountName)?.id ?? ''
        : '';
    setRelatedAccountId(destinationAccount);
    setFeedback('Modifica il movimento e salva per aggiornare il ledger.');
  };

  const cancelEditing = () => {
    setEditingTransactionId(null);
    setEditingTransferGroupId(null);
    setType('expense');
    setAmount('0');
    setDescription('');
    setCategory('');
    setBookedAt(todayIsoDate());
    setRelatedAccountId('');
    setFeedback('');
  };

  const removeTransaction = (transactionId: string, transferGroupId: string | null) => {
    deleteTransaction(database, {
      id: transactionId,
      transferGroupId,
    });

    setFeedback(transferGroupId ? 'Trasferimento eliminato da entrambi i conti.' : 'Movimento eliminato.');
    refreshData();
  };

  return (
    <AppScreen
      eyebrow="Movimenti"
      title="Inserimento manuale senza attriti"
      description="La base operativa e pronta: puoi registrare movimenti manuali e trasferimenti tra conti con effetto immediato sui saldi."
      hero={
        <InfoCard
          title="Attivita registrata"
          subtitle="Movimenti presenti nel database locale"
          value={`${filteredTransactions.length} movimenti`}
        />
      }
    >
      <SectionCard
        title={editingTransactionId ? 'Modifica movimento' : 'Nuovo movimento'}
        description="Usa il form per inserire entrate, uscite o trasferimenti. I trasferimenti generano due registrazioni coerenti tra conto origine e destinazione."
      >
        <ChoiceChips label="Tipo movimento" onSelect={setType} options={transactionTypeOptions} selectedValue={type} />
        <TextField label="Descrizione" onChangeText={setDescription} placeholder="Es. Spesa supermercato" value={description} />
        <TextField label="Categoria" onChangeText={setCategory} placeholder="Es. Alimentari" value={category} />
        <TextField label="Importo" keyboardType="numeric" onChangeText={setAmount} placeholder="0,00" value={amount} />
        <TextField label="Data" onChangeText={setBookedAt} placeholder="YYYY-MM-DD" value={bookedAt} />
        {accountOptions.length > 0 ? (
          <ChoiceChips label="Conto" onSelect={setAccountId} options={accountOptions} selectedValue={accountId} />
        ) : null}
        {type === 'transfer' && targetAccountOptions.length > 0 ? (
          <ChoiceChips
            label="Conto destinazione"
            onSelect={setRelatedAccountId}
            options={targetAccountOptions}
            selectedValue={relatedAccountId}
          />
        ) : null}
        <PrimaryButton label={editingTransactionId ? 'Aggiorna movimento' : 'Salva movimento'} onPress={saveTransaction} />
        {editingTransactionId ? <PrimaryButton label="Annulla modifica" onPress={cancelEditing} tone="secondary" /> : null}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </SectionCard>

      <SectionCard
        title="Filtra il ledger"
        description="Riduci il rumore visivo e lavora sui movimenti giusti senza perdere contesto."
      >
        <ChoiceChips
          label="Tipo"
          onSelect={setActiveTypeFilter}
          options={transactionFilterOptions as unknown as Array<{ label: string; value: (typeof transactionFilterOptions)[number]['value'] }>}
          selectedValue={activeTypeFilter}
        />
        <ChoiceChips label="Conto" onSelect={setActiveAccountFilter} options={filterAccountOptions} selectedValue={activeAccountFilter} />
      </SectionCard>

      {filteredTransactions.map((transaction) => (
        <View key={transaction.id} style={styles.transactionRow}>
          <View style={styles.transactionText}>
            <Text style={styles.transactionTitle}>{transaction.description}</Text>
            <Text style={styles.transactionMeta}>
              {formatTransactionType(transaction.transferGroupId ? 'transfer' : transaction.type)} · {transaction.accountName}
              {transaction.relatedAccountName ? ` -> ${transaction.relatedAccountName}` : ''} · {formatDate(transaction.bookedAt)}
            </Text>
          </View>
          <View style={styles.transactionAside}>
            <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
            <Text style={styles.transactionCategory}>{transaction.category}</Text>
            <Pressable onPress={() => startEditingTransaction(transaction.id)} style={styles.editChip}>
              <Text style={styles.editChipLabel}>Modifica</Text>
            </Pressable>
            <Pressable onPress={() => removeTransaction(transaction.id, transaction.transferGroupId)} style={styles.deleteChip}>
              <Text style={styles.deleteChipLabel}>{transaction.transferGroupId ? 'Elimina gruppo' : 'Elimina'}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  transactionRow: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  transactionText: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 17,
    color: colors.textPrimary,
  },
  transactionMeta: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontFamily: typography.title,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  transactionAside: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  transactionCategory: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  feedback: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.success,
  },
  deleteChip: {
    marginTop: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteChipLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.danger,
  },
  editChip: {
    marginTop: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.panelMuted,
  },
  editChipLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.textPrimary,
  },
});