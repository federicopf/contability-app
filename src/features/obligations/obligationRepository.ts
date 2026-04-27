import type * as SQLite from 'expo-sqlite';

import type { Obligation, ObligationType } from '../../types/domain';
import { generateId } from '../../utils/id';

export type ObligationListItem = Obligation;

type ObligationRow = {
  id: string;
  type: ObligationType;
  counterparty: string;
  amount: number;
  due_at: string;
  status: 'open' | 'closed';
};

export function listObligations(database: SQLite.SQLiteDatabase): ObligationListItem[] {
  const rows = database.getAllSync<ObligationRow>(`
    SELECT
      id,
      type,
      counterparty,
      amount,
      due_at,
      CASE WHEN status = 'closed' THEN 'closed' ELSE 'open' END as status
    FROM obligations
    ORDER BY
      CASE status
        WHEN 'open' THEN 1
        ELSE 3
      END,
      due_at ASC,
      created_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    counterparty: row.counterparty,
    amount: row.amount,
    dueAt: row.due_at,
    status: row.status,
  }));
}

export function createObligation(
  database: SQLite.SQLiteDatabase,
  input: { type: ObligationType; counterparty: string; amount: number; dueAt: string; status: 'open' | 'closed' },
) {
  database.runSync(
    'INSERT INTO obligations (id, type, counterparty, amount, due_at, status, paid_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [generateId('obligation'), input.type, input.counterparty.trim(), input.amount, input.dueAt, input.status, 0],
  );
}

export function deleteObligation(database: SQLite.SQLiteDatabase, input: { obligationId: string }) {
  database.runSync('DELETE FROM obligations WHERE id = ?', [input.obligationId]);
}

export function updateObligation(
  database: SQLite.SQLiteDatabase,
  input: {
    obligationId: string;
    type: ObligationType;
    counterparty: string;
    amount: number;
    dueAt: string;
    status: 'open' | 'closed';
  },
) {
  database.runSync(
    'UPDATE obligations SET type = ?, counterparty = ?, amount = ?, due_at = ?, paid_amount = ?, status = ? WHERE id = ?',
    [input.type, input.counterparty.trim(), input.amount, input.dueAt, 0, input.status, input.obligationId],
  );
}