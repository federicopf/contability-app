import type * as SQLite from 'expo-sqlite';

import type { InstallmentPlan } from '../../types/domain';
import { generateId } from '../../utils/id';

type InstallmentRow = {
  id: string;
  name: string;
  cashflow_type: 'income' | 'expense';
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  next_due_date: string;
  active: number;
  account_id: string | null;
  account_name: string | null;
};

export type InstallmentListItem = InstallmentPlan & {
  accountName: string | null;
  remainingInstallments: number;
};

export function listInstallments(database: SQLite.SQLiteDatabase): InstallmentListItem[] {
  const rows = database.getAllSync<InstallmentRow>(`
    SELECT
      p.id,
      p.name,
      p.cashflow_type,
      p.installment_amount,
      p.total_installments,
      p.paid_installments,
      p.next_due_date,
      p.active,
      p.account_id,
      a.name as account_name
    FROM installment_plans p
    LEFT JOIN accounts a ON a.id = p.account_id
    ORDER BY p.active DESC, p.next_due_date ASC, p.name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    cashflowType: row.cashflow_type,
    installmentAmount: row.installment_amount,
    totalInstallments: row.total_installments,
    paidInstallments: row.paid_installments,
    nextDueDate: row.next_due_date,
    active: Boolean(row.active),
    accountId: row.account_id,
    accountName: row.account_name,
    remainingInstallments: Math.max(row.total_installments - row.paid_installments, 0),
  }));
}

export function createInstallment(
  database: SQLite.SQLiteDatabase,
  input: {
    name: string;
    cashflowType: 'income' | 'expense';
    installmentAmount: number;
    totalInstallments: number;
    nextDueDate: string;
    accountId?: string;
  },
) {
  database.runSync(
    `INSERT INTO installment_plans
      (id, name, cashflow_type, installment_amount, total_installments, paid_installments, next_due_date, active, account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId('installment'),
      input.name.trim(),
      input.cashflowType,
      input.installmentAmount,
      input.totalInstallments,
      0,
      input.nextDueDate,
      1,
      input.accountId ?? null,
    ],
  );
}

export function updateInstallment(
  database: SQLite.SQLiteDatabase,
  input: {
    installmentId: string;
    name: string;
    cashflowType: 'income' | 'expense';
    installmentAmount: number;
    totalInstallments: number;
    nextDueDate: string;
    accountId?: string;
  },
) {
  const existing = database.getFirstSync<{ paid_installments: number; active: number }>(
    'SELECT paid_installments, active FROM installment_plans WHERE id = ?',
    [input.installmentId],
  );

  const paidInstallments = Math.min(existing?.paid_installments ?? 0, input.totalInstallments);
  const isActive = paidInstallments < input.totalInstallments && Boolean(existing?.active ?? 1);

  database.runSync(
    `UPDATE installment_plans
     SET name = ?, cashflow_type = ?, installment_amount = ?, total_installments = ?, paid_installments = ?, next_due_date = ?, active = ?, account_id = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.cashflowType,
      input.installmentAmount,
      input.totalInstallments,
      paidInstallments,
      input.nextDueDate,
      isActive ? 1 : 0,
      input.accountId ?? null,
      input.installmentId,
    ],
  );
}

export function registerInstallmentPayment(database: SQLite.SQLiteDatabase, input: { installmentId: string }) {
  const installment = database.getFirstSync<{
    name: string;
    cashflow_type: 'income' | 'expense';
    installment_amount: number;
    total_installments: number;
    paid_installments: number;
    next_due_date: string;
    account_id: string | null;
  }>(
    'SELECT name, cashflow_type, installment_amount, total_installments, paid_installments, next_due_date, account_id FROM installment_plans WHERE id = ?',
    [
    input.installmentId,
    ],
  );

  if (!installment || installment.paid_installments >= installment.total_installments) {
    return;
  }

  const nextPaidInstallments = installment.paid_installments + 1;
  const completed = nextPaidInstallments >= installment.total_installments;
  const nextDueDate = advanceOneMonth(installment.next_due_date);

  database.withTransactionSync(() => {
    database.runSync(
      'UPDATE installment_plans SET paid_installments = ?, next_due_date = ?, active = ? WHERE id = ?',
      [nextPaidInstallments, nextDueDate, completed ? 0 : 1, input.installmentId],
    );

    if (installment.account_id) {
      database.runSync(
        `INSERT INTO ledger_transactions
         (id, account_id, type, amount, category, description, booked_at, related_account_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('transaction'),
          installment.account_id,
          installment.cashflow_type,
          installment.installment_amount,
          'Rate',
          `${installment.name} (${nextPaidInstallments}/${installment.total_installments})`,
          installment.next_due_date,
          null,
        ],
      );
    }
  });
}

export function toggleInstallmentActive(
  database: SQLite.SQLiteDatabase,
  input: { installmentId: string; active: boolean },
) {
  database.runSync('UPDATE installment_plans SET active = ? WHERE id = ?', [input.active ? 1 : 0, input.installmentId]);
}

export function deleteInstallment(database: SQLite.SQLiteDatabase, input: { installmentId: string }) {
  database.runSync('DELETE FROM installment_plans WHERE id = ?', [input.installmentId]);
}

function advanceOneMonth(isoDate: string) {
  const nextDate = new Date(isoDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate.toISOString().slice(0, 10);
}