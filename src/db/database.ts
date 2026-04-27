import * as SQLite from 'expo-sqlite';

import type { AccountType } from '../types/domain';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase() {
  if (!databaseInstance) {
    databaseInstance = SQLite.openDatabaseSync('contability.db');
  }

  return databaseInstance;
}

export function initializeDatabase() {
  const db = getDatabase();

  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger_transactions (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      booked_at TEXT NOT NULL,
      note TEXT,
      related_account_id TEXT,
      transfer_group_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id)
    );

    CREATE TABLE IF NOT EXISTS obligations (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      amount REAL NOT NULL,
      due_at TEXT NOT NULL,
      status TEXT NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      next_billing_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      account_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id)
    );

    CREATE TABLE IF NOT EXISTS installment_plans (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      cashflow_type TEXT NOT NULL DEFAULT 'expense',
      installment_amount REAL NOT NULL,
      total_installments INTEGER NOT NULL,
      paid_installments INTEGER NOT NULL DEFAULT 0,
      next_due_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      account_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id)
    );
  `);

  ensureColumn(db, 'obligations', 'paid_amount', 'REAL NOT NULL DEFAULT 0');
  ensureColumn(db, 'ledger_transactions', 'transfer_group_id', 'TEXT');
  ensureColumn(db, 'installment_plans', 'cashflow_type', "TEXT NOT NULL DEFAULT 'expense'");

  seedStarterAccounts(db);

  return db;
}

function ensureColumn(db: SQLite.SQLiteDatabase, tableName: string, columnName: string, sqlDefinition: string) {
  const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.execSync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlDefinition};`);
  }
}

function seedStarterAccounts(db: SQLite.SQLiteDatabase) {
  const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');

  if ((result?.count ?? 0) > 0) {
    return;
  }

  const starterAccounts: Array<{ name: string; type: AccountType }> = [
    { name: 'Portafoglio', type: 'cash' },
    { name: 'Carta principale', type: 'card' },
    { name: 'Conto corrente', type: 'bank' },
  ];

  starterAccounts.forEach((account, index) => {
    db.runSync(
      'INSERT INTO accounts (id, name, type, opening_balance, currency) VALUES (?, ?, ?, ?, ?)',
      [`starter-account-${index + 1}`, account.name, account.type, 0, 'EUR'],
    );
  });
}