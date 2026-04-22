import type * as SQLite from 'expo-sqlite';

import type { Account, AccountType } from '../../types/domain';
import { generateId } from '../../utils/id';

export type AccountListItem = Account & {
  currentBalance: number;
};

type AccountRow = {
  id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  currency: 'EUR';
  current_balance: number;
};

export function listAccounts(database: SQLite.SQLiteDatabase): AccountListItem[] {
  const rows = database.getAllSync<AccountRow>(`
    SELECT
      a.id,
      a.name,
      a.type,
      a.opening_balance,
      a.currency,
      a.opening_balance + COALESCE(SUM(
        CASE
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      ), 0) as current_balance
    FROM accounts a
    LEFT JOIN ledger_transactions t ON t.account_id = a.id
    GROUP BY a.id, a.name, a.type, a.opening_balance, a.currency
    ORDER BY CASE a.type
      WHEN 'cash' THEN 1
      WHEN 'card' THEN 2
      WHEN 'bank' THEN 3
      WHEN 'wallet' THEN 4
      ELSE 5
    END, a.name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    openingBalance: row.opening_balance,
    currency: row.currency,
    currentBalance: row.current_balance,
  }));
}

export function createAccount(
  database: SQLite.SQLiteDatabase,
  input: { name: string; type: AccountType; openingBalance: number },
) {
  database.runSync(
    'INSERT INTO accounts (id, name, type, opening_balance, currency) VALUES (?, ?, ?, ?, ?)',
    [generateId('account'), input.name.trim(), input.type, input.openingBalance, 'EUR'],
  );
}

export function updateAccount(
  database: SQLite.SQLiteDatabase,
  input: { id: string; name: string; type: AccountType; openingBalance: number },
) {
  database.runSync('UPDATE accounts SET name = ?, type = ?, opening_balance = ? WHERE id = ?', [
    input.name.trim(),
    input.type,
    input.openingBalance,
    input.id,
  ]);
}

export function deleteAccount(database: SQLite.SQLiteDatabase, input: { id: string }) {
  const transactionCount = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM ledger_transactions WHERE account_id = ? OR related_account_id = ?',
    [input.id, input.id],
  );
  const subscriptionCount = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM subscriptions WHERE account_id = ?',
    [input.id],
  );

  if ((transactionCount?.count ?? 0) > 0 || (subscriptionCount?.count ?? 0) > 0) {
    throw new Error('Non puoi eliminare un conto che ha gia movimenti o abbonamenti collegati.');
  }

  database.runSync('DELETE FROM accounts WHERE id = ?', [input.id]);
}