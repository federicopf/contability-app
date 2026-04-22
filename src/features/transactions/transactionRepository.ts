import type * as SQLite from 'expo-sqlite';

import type { TransactionType } from '../../types/domain';
import { generateId } from '../../utils/id';

export type TransactionListItem = {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  bookedAt: string;
  accountName: string;
  relatedAccountName: string | null;
  transferGroupId: string | null;
};

type TransactionRow = {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  booked_at: string;
  account_name: string;
  related_account_name: string | null;
  transfer_group_id: string | null;
};

export function listTransactions(database: SQLite.SQLiteDatabase): TransactionListItem[] {
  const rows = database.getAllSync<TransactionRow>(`
    SELECT
      t.id,
      t.account_id,
      t.type,
      t.amount,
      t.category,
      t.description,
      t.booked_at,
      a.name as account_name,
      ra.name as related_account_name,
      t.transfer_group_id
    FROM ledger_transactions t
    INNER JOIN accounts a ON a.id = t.account_id
    LEFT JOIN accounts ra ON ra.id = t.related_account_id
    ORDER BY t.booked_at DESC, t.created_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    description: row.description,
    bookedAt: row.booked_at,
    accountName: row.account_name,
    relatedAccountName: row.related_account_name,
    transferGroupId: row.transfer_group_id,
  }));
}

export function createTransaction(
  database: SQLite.SQLiteDatabase,
  input: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    bookedAt: string;
    accountId: string;
    relatedAccountId?: string;
  },
) {
  const cleanedDescription = input.description.trim();
  const cleanedCategory = input.category.trim() || defaultCategory(input.type);

  if (input.type === 'transfer' && input.relatedAccountId) {
    const destinationAccountId = input.relatedAccountId;
    const transferGroupId = generateId('transfer');

    database.withTransactionSync(() => {
      database.runSync(
        `INSERT INTO ledger_transactions
         (id, account_id, type, amount, category, description, booked_at, related_account_id, transfer_group_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('transaction'),
          input.accountId,
          'expense',
          input.amount,
          'Trasferimento',
          cleanedDescription,
          input.bookedAt,
          destinationAccountId,
          transferGroupId,
        ],
      );

      database.runSync(
        `INSERT INTO ledger_transactions
         (id, account_id, type, amount, category, description, booked_at, related_account_id, transfer_group_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('transaction'),
          destinationAccountId,
          'income',
          input.amount,
          'Trasferimento',
          cleanedDescription,
          input.bookedAt,
          input.accountId,
          transferGroupId,
        ],
      );
    });

    return;
  }

  database.runSync(
    `INSERT INTO ledger_transactions
     (id, account_id, type, amount, category, description, booked_at, related_account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId('transaction'),
      input.accountId,
      input.type,
      input.amount,
      cleanedCategory,
      cleanedDescription,
      input.bookedAt,
      input.relatedAccountId ?? null,
    ],
  );
}

export function deleteTransaction(database: SQLite.SQLiteDatabase, input: { id: string; transferGroupId?: string | null }) {
  if (input.transferGroupId) {
    database.runSync('DELETE FROM ledger_transactions WHERE transfer_group_id = ?', [input.transferGroupId]);
    return;
  }

  database.runSync('DELETE FROM ledger_transactions WHERE id = ?', [input.id]);
}

function defaultCategory(type: TransactionType) {
  switch (type) {
    case 'income':
      return 'Entrata';
    case 'expense':
      return 'Spesa';
    case 'transfer':
      return 'Trasferimento';
  }
}