import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { ChoiceChips } from '../components/ChoiceChips';
import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SectionCard } from '../components/SectionCard';
import { TextField } from '../components/TextField';
import { useDatabase } from '../db/DatabaseProvider';
import { createAccount } from '../features/accounts/accountRepository';
import { useAccounts } from '../features/accounts/useAccounts';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { AccountType } from '../types/domain';
import { formatAccountType, formatCurrency } from '../utils/format';

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
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [type, setType] = useState<AccountType>('cash');
  const [feedback, setFeedback] = useState('');
  const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const groupedBalances = accountTypeOptions
    .map((option) => ({
      label: option.label,
      total: accounts
        .filter((account) => account.type === option.value)
        .reduce((sum, account) => sum + account.currentBalance, 0),
    }))
    .filter((item) => item.total !== 0);

  const addAccount = () => {
    const parsedOpeningBalance = Number.parseFloat(openingBalance.replace(',', '.'));

    if (!name.trim()) {
      setFeedback('Inserisci un nome conto prima di salvare.');
      return;
    }

    if (Number.isNaN(parsedOpeningBalance)) {
      setFeedback('Il saldo iniziale deve essere un numero valido.');
      return;
    }

    createAccount(database, {
      name,
      type,
      openingBalance: parsedOpeningBalance,
    });

    setName('');
    setOpeningBalance('0');
    setType('cash');
    setFeedback('Conto salvato nel database locale.');
    refreshData();
  };

  return (
    <AppScreen
      eyebrow="Conti"
      title="Panorama dei tuoi soldi"
      description="Partiamo da una base elegante e leggibile: i conti sono gia organizzati per tipologia, pronti per essere collegati a saldi reali e movimenti manuali."
      hero={
        <InfoCard
          title="Patrimonio disponibile"
          subtitle="Somma rapida dei conti attivi letta dal database locale"
          value={formatCurrency(totalBalance)}
          tone="strong"
        />
      }
    >
      {accounts.map((account) => (
        <View key={account.id} style={styles.accountRow}>
          <View style={styles.accountText}>
            <Text style={styles.accountLabel}>{account.name}</Text>
            <Text style={styles.accountDetail}>
              {formatAccountType(account.type)} · Saldo iniziale {formatCurrency(account.openingBalance)}
            </Text>
          </View>
          <Text style={styles.accountBalance}>{formatCurrency(account.currentBalance)}</Text>
        </View>
      ))}

      {groupedBalances.length > 0 ? (
        <SectionCard
          title="Distribuzione per tipologia"
          description="Una lettura rapida di dove si concentra la tua liquidita tra contanti, carte e banca."
        >
          {groupedBalances.map((item) => (
            <View key={item.label} style={styles.typeRow}>
              <Text style={styles.typeLabel}>{item.label}</Text>
              <Text style={styles.typeAmount}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Aggiungi un conto"
        description="Questa prima versione salva subito in SQLite. I saldi correnti restano derivati da saldo iniziale e movimenti registrati."
      >
        <TextField label="Nome conto" onChangeText={setName} placeholder="Es. Carta viaggi" value={name} />
        <TextField
          label="Saldo iniziale"
          keyboardType="numeric"
          onChangeText={setOpeningBalance}
          placeholder="0,00"
          value={openingBalance}
        />
        <ChoiceChips label="Tipologia" onSelect={setType} options={accountTypeOptions} selectedValue={type} />
        <PrimaryButton label="Salva conto" onPress={addAccount} />
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  accountRow: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  accountText: {
    flex: 1,
    gap: 4,
  },
  accountLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
  },
  accountDetail: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  accountBalance: {
    fontFamily: typography.title,
    fontSize: 20,
    color: colors.textPrimary,
    alignSelf: 'center',
  },
  feedback: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.success,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeLabel: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  typeAmount: {
    fontFamily: typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
});