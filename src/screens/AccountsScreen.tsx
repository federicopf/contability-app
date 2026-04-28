import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '../components/AppScreen';
import { useDatabase } from '../db/DatabaseProvider';
import { createAccount, deleteAccount, updateAccount } from '../features/accounts/accountRepository';
import { useAccounts } from '../features/accounts/useAccounts';
import { createTransaction, deleteTransaction } from '../features/transactions/transactionRepository';
import { useTransactions } from '../features/transactions/useTransactions';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { AccountType } from '../types/domain';
import { todayIsoDate } from '../utils/date';
import { formatCurrency, formatDate } from '../utils/format';

const TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Contanti',
  card: 'Carta',
  bank: 'Banca',
  wallet: 'Wallet',
  other: 'Altro',
};

const accountTypeOptions: Array<{ label: string; value: AccountType }> = [
  { label: 'Contanti', value: 'cash' },
  { label: 'Carta', value: 'card' },
  { label: 'Banca', value: 'bank' },
  { label: 'Wallet', value: 'wallet' },
  { label: 'Altro', value: 'other' },
];

export function AccountsScreen() {
  const { database, refreshData } = useDatabase();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('cash');

  const [movType, setMovType] = useState<'income' | 'expense'>('expense');
  const [movAmount, setMovAmount] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [movDate, setMovDate] = useState(todayIsoDate());

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const txByAccount = useMemo(() => {
    const map: Record<string, typeof transactions> = {};
    for (const tx of transactions) {
      if (!tx.transferGroupId && (tx.type === 'income' || tx.type === 'expense')) {
        (map[tx.accountId] ??= []).push(tx);
      }
    }
    return map;
  }, [transactions]);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const saveAccount = () => {
    if (!accountName.trim()) return;
    if (editingId) {
      updateAccount(database, { id: editingId, name: accountName, type: accountType });
    } else {
      createAccount(database, { name: accountName, type: accountType });
    }
    clearForm();
    refreshData();
    setShowAddForm(false);
  };

  const startEdit = (id: string) => {
    const a = accounts.find((x) => x.id === id);
    if (!a) return;
    setEditingId(a.id);
    setAccountName(a.name);
    setAccountType(a.type);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    clearForm();
    setShowAddForm(false);
  };

  const clearForm = () => {
    setEditingId(null);
    setAccountName('');
    setAccountType('cash');
  };

  const removeAccount = (id: string) => {
    try {
      deleteAccount(database, { id });
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) cancelEdit();
      refreshData();
    } catch {}
  };

  const saveMov = (accountId: string) => {
    const amount = Number.parseFloat(movAmount.replace(',', '.'));
    if (!accountId || Number.isNaN(amount) || amount <= 0 || !movDesc.trim()) return;
    createTransaction(database, {
      type: movType,
      amount,
      category: '',
      description: movDesc,
      bookedAt: movDate,
      accountId,
    });
    setMovAmount('');
    setMovDesc('');
    setMovType('expense');
    setMovDate(todayIsoDate());
    refreshData();
  };

  const removeMov = (txId: string) => {
    deleteTransaction(database, { id: txId });
    refreshData();
  };

  const addButton = (
    <Pressable onPress={() => setShowAddForm(true)} style={styles.plusBtn}>
      <MaterialIcons name="add" size={20} color={colors.accent} />
    </Pressable>
  );

  return (
    <>
      <AppScreen eyebrow="Conti" title="Conti" actionButton={addButton}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Totale</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBalance)}</Text>
        </View>

        {accounts.length === 0 ? (
          <Text style={styles.empty}>Nessun conto. Usa il + per crearne uno.</Text>
        ) : (
          accounts.map((account) => {
            const isOpen = expandedId === account.id;
            const txs = (txByAccount[account.id] ?? []).sort((a, b) => (a.bookedAt < b.bookedAt ? 1 : -1));
            return (
              <View key={account.id} style={styles.card}>
                <Pressable onPress={() => toggle(account.id)} style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardName}>{account.name}</Text>
                    <Text style={styles.cardType}>{TYPE_LABELS[account.type]}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardBalance}>{formatCurrency(account.currentBalance)}</Text>
                    <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                  </View>
                </Pressable>

                {isOpen && (
                  <View style={styles.expanded}>
                    <View style={styles.rowGap}>
                      <Pressable onPress={() => startEdit(account.id)} style={styles.chip}>
                        <Text style={styles.chipText}>Modifica</Text>
                      </Pressable>
                      <Pressable onPress={() => removeAccount(account.id)} style={[styles.chip, styles.chipDanger]}>
                        <Text style={[styles.chipText, styles.chipTextDanger]}>Elimina</Text>
                      </Pressable>
                    </View>

                    <View style={styles.rowGap}>
                      {(['expense', 'income'] as const).map((t) => (
                        <Pressable
                          key={t}
                          onPress={() => setMovType(t)}
                          style={[styles.chip, movType === t && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, movType === t && styles.chipTextActive]}>
                            {t === 'expense' ? 'Uscita' : 'Entrata'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <TextInput
                      onChangeText={setMovDesc}
                      placeholder="Descrizione"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                      value={movDesc}
                    />
                    <View style={styles.rowGap}>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={setMovAmount}
                        placeholder="Importo"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, styles.inputFlex]}
                        value={movAmount}
                      />
                      <TextInput
                        onChangeText={setMovDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, styles.inputFlex]}
                        value={movDate}
                      />
                    </View>
                    <Pressable onPress={() => saveMov(account.id)} style={styles.btn}>
                      <Text style={styles.btnText}>+ Movimento</Text>
                    </Pressable>

                    {txs.length > 0 && (
                      <View style={styles.txList}>
                        {txs.map((tx) => (
                          <View key={tx.id} style={styles.txRow}>
                            <View style={styles.txLeft}>
                              <Text style={styles.txDesc}>{tx.description}</Text>
                              <Text style={styles.txMeta}>{formatDate(tx.bookedAt)}</Text>
                            </View>
                            <View style={styles.txRight}>
                              <Text style={[styles.txAmount, tx.type === 'income' ? styles.income : styles.expense]}>
                                {tx.type === 'expense' ? '−' : '+'}{formatCurrency(tx.amount)}
                              </Text>
                              <Pressable onPress={() => removeMov(tx.id)}>
                                <Text style={styles.del}>×</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </AppScreen>

      <Modal visible={showAddForm} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Modifica conto' : 'Nuovo conto'}</Text>
              <Pressable onPress={cancelEdit}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <TextInput
              onChangeText={setAccountName}
              placeholder="Nome conto"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={accountName}
            />
            <View style={styles.rowGap}>
              {accountTypeOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setAccountType(opt.value)}
                  style={[styles.chip, accountType === opt.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, accountType === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.rowGap}>
              <Pressable onPress={saveAccount} style={[styles.btn, styles.btnFlex]}>
                <Text style={styles.btnText}>{editingId ? 'Aggiorna' : 'Crea conto'}</Text>
              </Pressable>
              {editingId && (
                <Pressable onPress={cancelEdit} style={[styles.btn, styles.btnSecondary, styles.btnFlex]}>
                  <Text style={styles.btnSecondaryText}>Annulla</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  totalLabel: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontFamily: typography.title,
    fontSize: 22,
    color: colors.textPrimary,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardName: {
    fontFamily: typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  cardType: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardBalance: {
    fontFamily: typography.title,
    fontSize: 16,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  expanded: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowGap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
  },
  chipActive: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.panelStrong,
  },
  chipDanger: {
    borderColor: colors.danger,
    backgroundColor: 'transparent',
  },
  chipText: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  chipTextDanger: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputFlex: {
    flex: 1,
  },
  btn: {
    backgroundColor: colors.panelStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    alignItems: 'center',
  },
  btnFlex: {
    flex: 1,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
    color: colors.textInverse,
  },
  btnSecondaryText: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
    color: colors.textPrimary,
  },
  txList: {
    gap: 1,
    marginTop: spacing.xs,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  txLeft: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  txMeta: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txAmount: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
  },
  income: {
    color: colors.success,
  },
  expense: {
    color: colors.danger,
  },
  del: {
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
  },
});
