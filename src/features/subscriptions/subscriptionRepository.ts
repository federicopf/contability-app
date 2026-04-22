import type * as SQLite from 'expo-sqlite';

import type { Subscription, SubscriptionFrequency } from '../../types/domain';
import { generateId } from '../../utils/id';

type SubscriptionRow = {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  next_billing_date: string;
  active: number;
  account_id: string | null;
  account_name: string | null;
};

export type SubscriptionListItem = Subscription & {
  accountName: string | null;
};

export function listSubscriptions(database: SQLite.SQLiteDatabase): SubscriptionListItem[] {
  const rows = database.getAllSync<SubscriptionRow>(`
    SELECT s.id, s.name, s.amount, s.frequency, s.next_billing_date, s.active, s.account_id, a.name as account_name
    FROM subscriptions s
    LEFT JOIN accounts a ON a.id = s.account_id
    ORDER BY s.active DESC, s.next_billing_date ASC, s.name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: row.amount,
    frequency: row.frequency,
    nextBillingDate: row.next_billing_date,
    active: Boolean(row.active),
    accountId: row.account_id,
    accountName: row.account_name,
  }));
}

export function createSubscription(
  database: SQLite.SQLiteDatabase,
  input: {
    name: string;
    amount: number;
    frequency: SubscriptionFrequency;
    nextBillingDate: string;
    accountId?: string;
  },
) {
  database.runSync(
    `INSERT INTO subscriptions (id, name, amount, frequency, next_billing_date, active, account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId('subscription'),
      input.name.trim(),
      input.amount,
      input.frequency,
      input.nextBillingDate,
      1,
      input.accountId ?? null,
    ],
  );
}

export function renewSubscription(database: SQLite.SQLiteDatabase, input: { subscriptionId: string }) {
  const subscription = database.getFirstSync<{
    name: string;
    amount: number;
    frequency: SubscriptionFrequency;
    next_billing_date: string;
    account_id: string | null;
  }>('SELECT name, amount, frequency, next_billing_date, account_id FROM subscriptions WHERE id = ?', [input.subscriptionId]);

  if (!subscription) {
    return;
  }

  const currentBillingDate = new Date(subscription.next_billing_date);
  const nextBillingDate = advanceDate(currentBillingDate, subscription.frequency).toISOString().slice(0, 10);

  database.withTransactionSync(() => {
    database.runSync('UPDATE subscriptions SET next_billing_date = ? WHERE id = ?', [nextBillingDate, input.subscriptionId]);

    if (subscription.account_id) {
      database.runSync(
        `INSERT INTO ledger_transactions
         (id, account_id, type, amount, category, description, booked_at, related_account_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('transaction'),
          subscription.account_id,
          'expense',
          subscription.amount,
          'Abbonamenti',
          subscription.name,
          subscription.next_billing_date,
          null,
        ],
      );
    }
  });
}

function advanceDate(currentDate: Date, frequency: SubscriptionFrequency) {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}