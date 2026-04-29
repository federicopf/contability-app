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
  currency: 'EUR';
  current_balance: number;
};

export function listAccounts(database: SQLite.SQLiteDatabase): AccountListItem[] {
  const rows = database.getAllSync<AccountRow>(`
    SELECT
      a.id,
      a.name,
      a.type,
      a.currency,
      COALESCE(SUM(
        CASE
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      ), 0) as current_balance
    FROM accounts a
    LEFT JOIN ledger_transactions t ON t.account_id = a.id
    WHERE a.deleted_at IS NULL
    GROUP BY a.id, a.name, a.type, a.currency
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
    currency: row.currency,
    currentBalance: row.current_balance,
  }));
}

export function createAccount(
  database: SQLite.SQLiteDatabase,
  input: { name: string; type: AccountType },
) {
  database.runSync(
    'INSERT INTO accounts (id, name, type, opening_balance, currency) VALUES (?, ?, ?, ?, ?)',
    [generateId('account'), input.name.trim(), input.type, 0, 'EUR'],
  );
}

export function updateAccount(
  database: SQLite.SQLiteDatabase,
  input: { id: string; name: string; type: AccountType },
) {
  database.runSync('UPDATE accounts SET name = ?, type = ? WHERE id = ? AND deleted_at IS NULL', [input.name.trim(), input.type, input.id]);
}

export function deleteAccount(database: SQLite.SQLiteDatabase, input: { id: string }) {
  database.withTransactionSync(() => {
    database.runSync('UPDATE accounts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [input.id]);
    database.runSync('UPDATE subscriptions SET account_id = NULL WHERE account_id = ?', [input.id]);
    database.runSync('UPDATE installment_plans SET account_id = NULL WHERE account_id = ?', [input.id]);
  });
}