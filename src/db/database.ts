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
  `);

  seedStarterAccounts(db);

  return db;
}

function seedStarterAccounts(db: SQLite.SQLiteDatabase) {
  const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');

  if ((result?.count ?? 0) > 0) {
    return;
  }

  const starterAccounts: Array<{ name: string; type: AccountType; openingBalance: number }> = [
    { name: 'Portafoglio', type: 'cash', openingBalance: 180 },
    { name: 'Carta principale', type: 'card', openingBalance: 2340 },
    { name: 'Conto corrente', type: 'bank', openingBalance: 8920 },
  ];

  starterAccounts.forEach((account, index) => {
    db.runSync(
      'INSERT INTO accounts (id, name, type, opening_balance, currency) VALUES (?, ?, ?, ?, ?)',
      [`starter-account-${index + 1}`, account.name, account.type, account.openingBalance, 'EUR'],
    );
  });
}