import type * as SQLite from 'expo-sqlite';

export type PeriodSnapshot = {
  income: number;
  expense: number;
  net: number;
  transactionsCount: number;
};

export type CategoryBreakdownItem = {
  category: string;
  total: number;
};

export type AccountBreakdownItem = {
  accountName: string;
  balance: number;
};

export type StatisticsPeriodKey = 'currentMonth' | 'previousMonth' | 'currentYear';

type SummaryRow = {
  income: number | null;
  expense: number | null;
  transactions_count: number | null;
};

type CategoryRow = {
  category: string;
  total: number;
};

type AccountRow = {
  account_name: string;
  balance: number;
};

export function getStatisticsSnapshot(database: SQLite.SQLiteDatabase) {
  const currentMonthRange = monthRange(0);
  const previousMonthRange = monthRange(-1);
  const currentYearRange = yearRange();

  return {
    currentMonth: readSummary(database, currentMonthRange.start, currentMonthRange.end),
    previousMonth: readSummary(database, previousMonthRange.start, previousMonthRange.end),
    currentYear: readSummary(database, currentYearRange.start, currentYearRange.end),
    topExpenseCategories: {
      currentMonth: readTopExpenseCategories(database, currentMonthRange.start, currentMonthRange.end),
      previousMonth: readTopExpenseCategories(database, previousMonthRange.start, previousMonthRange.end),
      currentYear: readTopExpenseCategories(database, currentYearRange.start, currentYearRange.end),
    },
    accountBalances: readAccountBalances(database),
  };
}

function readSummary(database: SQLite.SQLiteDatabase, startDate: string, endDate: string): PeriodSnapshot {
  const row = database.getFirstSync<SummaryRow>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
        COUNT(*) as transactions_count
      FROM ledger_transactions
      WHERE booked_at >= ? AND booked_at <= ?
    `,
    [startDate, endDate],
  );

  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;

  return {
    income,
    expense,
    net: income - expense,
    transactionsCount: row?.transactions_count ?? 0,
  };
}

function readTopExpenseCategories(database: SQLite.SQLiteDatabase, startDate: string, endDate: string): CategoryBreakdownItem[] {
  const rows = database.getAllSync<CategoryRow>(
    `
      SELECT category, SUM(amount) as total
      FROM ledger_transactions
      WHERE type = 'expense' AND booked_at >= ? AND booked_at <= ?
      GROUP BY category
      ORDER BY total DESC, category ASC
      LIMIT 5
    `,
    [startDate, endDate],
  );

  return rows.map((row) => ({
    category: row.category,
    total: row.total,
  }));
}

function readAccountBalances(database: SQLite.SQLiteDatabase): AccountBreakdownItem[] {
  const rows = database.getAllSync<AccountRow>(`
    SELECT
      a.name as account_name,
      a.opening_balance + COALESCE(SUM(
        CASE
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          ELSE 0
        END
      ), 0) as balance
    FROM accounts a
    LEFT JOIN ledger_transactions t ON t.account_id = a.id
    GROUP BY a.id, a.name, a.opening_balance
    ORDER BY balance DESC, a.name ASC
  `);

  return rows.map((row) => ({
    accountName: row.account_name,
    balance: row.balance,
  }));
}

function monthRange(offset: number) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

  return {
    start: firstDay.toISOString().slice(0, 10),
    end: lastDay.toISOString().slice(0, 10),
  };
}

function yearRange() {
  const now = new Date();

  return {
    start: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10),
  };
}