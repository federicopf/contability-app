import type * as SQLite from 'expo-sqlite';

import type { Obligation, ObligationType } from '../../types/domain';
import { generateId } from '../../utils/id';

export type ObligationListItem = Obligation & {
  remainingAmount: number;
};

type ObligationRow = {
  id: string;
  type: ObligationType;
  counterparty: string;
  amount: number;
  due_at: string;
  status: 'open' | 'partial' | 'closed';
  paid_amount: number;
};

export function listObligations(database: SQLite.SQLiteDatabase): ObligationListItem[] {
  const rows = database.getAllSync<ObligationRow>(`
    SELECT id, type, counterparty, amount, due_at, status, paid_amount
    FROM obligations
    ORDER BY
      CASE status
        WHEN 'open' THEN 1
        WHEN 'partial' THEN 2
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
    paidAmount: row.paid_amount,
    remainingAmount: Math.max(row.amount - row.paid_amount, 0),
  }));
}

export function createObligation(
  database: SQLite.SQLiteDatabase,
  input: { type: ObligationType; counterparty: string; amount: number; dueAt: string },
) {
  database.runSync(
    'INSERT INTO obligations (id, type, counterparty, amount, due_at, status, paid_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [generateId('obligation'), input.type, input.counterparty.trim(), input.amount, input.dueAt, 'open', 0],
  );
}

export function registerObligationPayment(
  database: SQLite.SQLiteDatabase,
  input: { obligationId: string; amount: number; paidAt: string },
) {
  const obligation = database.getFirstSync<{ amount: number; paid_amount: number }>(
    'SELECT amount, paid_amount FROM obligations WHERE id = ?',
    [input.obligationId],
  );

  if (!obligation) {
    return;
  }

  const nextPaidAmount = Math.min(obligation.paid_amount + input.amount, obligation.amount);
  const nextStatus = nextPaidAmount >= obligation.amount ? 'closed' : nextPaidAmount > 0 ? 'partial' : 'open';

  database.withTransactionSync(() => {
    database.runSync(
      'INSERT INTO obligation_payments (id, obligation_id, amount, paid_at) VALUES (?, ?, ?, ?)',
      [generateId('obligation-payment'), input.obligationId, input.amount, input.paidAt],
    );
    database.runSync('UPDATE obligations SET paid_amount = ?, status = ? WHERE id = ?', [
      nextPaidAmount,
      nextStatus,
      input.obligationId,
    ]);
  });
}

export function deleteObligation(database: SQLite.SQLiteDatabase, input: { obligationId: string }) {
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM obligation_payments WHERE obligation_id = ?', [input.obligationId]);
    database.runSync('DELETE FROM obligations WHERE id = ?', [input.obligationId]);
  });
}