import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '../components/AppScreen';
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
  const insets = useSafeAreaInsets();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [cashflowType, setCashflowType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('0');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [nextDueDate, setNextDueDate] = useState(todayIsoDate());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ label: account.name, value: account.id })),
    [accounts],
  );

  const activeRatesCount = installments.filter((item) => item.active).length;

  const saveRate = () => {
    const parsedAmount = Number.parseFloat(installmentAmount.replace(',', '.'));
    const parsedCount = Number.parseInt(totalInstallments, 10);

    if (!name.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !Number.isInteger(parsedCount) || parsedCount <= 0) {
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
    refreshData();
    setShowAddForm(false);
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
    setShowAddForm(true);
  };

  const markInstallment = (installmentId: string) => {
    registerInstallmentPayment(database, { installmentId });
    refreshData();
  };

  const toggleRate = (installmentId: string, active: boolean) => {
    toggleInstallmentActive(database, { installmentId, active: !active });
    refreshData();
  };

  const removeRate = (installmentId: string) => {
    deleteInstallment(database, { installmentId });
    if (editingInstallmentId === installmentId) {
      clearForm();
    }
    refreshData();
  };

  const addButton = (
    <Pressable onPress={() => setShowAddForm(true)} style={styles.plusBtn}>
      <MaterialIcons name="add" size={20} color={colors.accent} />
    </Pressable>
  );

  return (
    <>
      <AppScreen
        eyebrow="Rate"
        title="Entrate e uscite ricorrenti"
        actionButton={addButton}
        hero={
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Rate attive</Text>
            <Text style={styles.infoValue}>{activeRatesCount}</Text>
          </View>
        }
      >
        {installments.length === 0 ? (
          <Text style={styles.empty}>Nessuna rata. Usa il + per crearne una.</Text>
        ) : (
          installments.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.cashflowType === 'income' ? 'Entrata' : 'Uscita'} · Rata {Math.min(item.paidInstallments + 1, item.totalInstallments)}/
                    {item.totalInstallments} · Scade il {formatDate(item.nextDueDate)}
                  </Text>
                  <Text style={styles.cardMeta}>Residue: {item.remainingInstallments} · Conto: {item.accountName ?? 'Nessuno'}</Text>
                </View>
                <Text style={styles.cardAmount}>{formatCurrency(item.installmentAmount)}</Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable onPress={() => startEditing(item.id)} style={styles.chip}>
                  <Text style={styles.chipText}>Modifica</Text>
                </Pressable>
                {item.active && item.remainingInstallments > 0 ? (
                  <Pressable onPress={() => markInstallment(item.id)} style={[styles.chip, styles.chipPrimary]}>
                    <Text style={[styles.chipText, styles.chipPrimaryText]}>Segna rata</Text>
                  </Pressable>
                ) : null}
                {item.remainingInstallments > 0 ? (
                  <Pressable onPress={() => toggleRate(item.id, item.active)} style={styles.chip}>
                    <Text style={styles.chipText}>{item.active ? 'Pausa' : 'Riattiva'}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => removeRate(item.id)} style={[styles.chip, styles.chipDanger]}>
                  <Text style={[styles.chipText, styles.chipDangerText]}>Elimina</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </AppScreen>

      <Modal visible={showAddForm} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginBottom: Math.max(insets.bottom, spacing.sm), paddingBottom: spacing.lg + insets.bottom }] }>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingInstallmentId ? 'Modifica rata' : 'Nuova rata'}</Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.rowGap}>
              {(['expense', 'income'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setCashflowType(t)}
                  style={[styles.chip, cashflowType === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, cashflowType === t && styles.chipTextActive]}>
                    {t === 'expense' ? 'Uscita' : 'Entrata'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              onChangeText={setName}
              placeholder="Nome rata"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={name}
            />
            <TextInput
              keyboardType="numeric"
              onChangeText={setInstallmentAmount}
              placeholder="Importo rata"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={installmentAmount}
            />
            <TextInput
              keyboardType="numeric"
              onChangeText={setTotalInstallments}
              placeholder="Numero totale rate"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={totalInstallments}
            />
            <TextInput
              onChangeText={setNextDueDate}
              placeholder="Prossima scadenza (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={nextDueDate}
            />

            {accountOptions.length > 0 && (
              <View style={styles.rowGap}>
                {accountOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAccountId(opt.value)}
                    style={[styles.chip, accountId === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, accountId === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.rowGap}>
              <Pressable onPress={saveRate} style={[styles.chip, styles.chipPrimary, styles.btnFlex]}>
                <Text style={[styles.chipText, styles.chipPrimaryText]}>{editingInstallmentId ? 'Aggiorna rata' : 'Salva rata'}</Text>
              </Pressable>
              {editingInstallmentId && (
                <Pressable onPress={() => setShowAddForm(false)} style={[styles.chip, styles.btnFlex]}>
                  <Text style={styles.chipText}>Annulla</Text>
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
  infoCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: typography.title,
    fontSize: 28,
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
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  cardMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardAmount: {
    fontFamily: typography.title,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  chipPrimary: {
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
  chipPrimaryText: {
    color: colors.textInverse,
  },
  chipDangerText: {
    color: colors.danger,
  },
  btnFlex: {
    flex: 1,
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
