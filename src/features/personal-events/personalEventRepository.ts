import type * as SQLite from 'expo-sqlite';

import type { PersonalEconomicEvent } from '../../types/domain';
import { generateId } from '../../utils/id';

type PersonalEventRow = {
  id: string;
  title: string;
  cashflow_type: 'income' | 'expense';
  recurrence: 'none' | 'monthly';
  due_at: string;
  status: 'todo' | 'done';
  note: string | null;
};

export function listPersonalEconomicEvents(database: SQLite.SQLiteDatabase): PersonalEconomicEvent[] {
  const rows = database.getAllSync<PersonalEventRow>(`
    SELECT id, title, cashflow_type, recurrence, due_at, status, note
    FROM personal_economic_events
    ORDER BY status ASC, due_at ASC, created_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    cashflowType: row.cashflow_type,
    recurrence: row.recurrence,
    dueAt: row.due_at,
    status: row.status,
    note: row.note,
  }));
}

export function createPersonalEconomicEvent(
  database: SQLite.SQLiteDatabase,
  input: {
    title: string;
    cashflowType: 'income' | 'expense';
    recurrence: 'none' | 'monthly';
    dueAt: string;
    note?: string;
  },
) {
  database.runSync(
    `INSERT INTO personal_economic_events (id, title, cashflow_type, recurrence, due_at, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId('personal-event'),
      input.title.trim(),
      input.cashflowType,
      input.recurrence,
      input.dueAt,
      'todo',
      input.note?.trim() ? input.note.trim() : null,
    ],
  );
}

export function updatePersonalEconomicEvent(
  database: SQLite.SQLiteDatabase,
  input: {
    eventId: string;
    title: string;
    cashflowType: 'income' | 'expense';
    recurrence: 'none' | 'monthly';
    dueAt: string;
    note?: string;
  },
) {
  database.runSync(
    `UPDATE personal_economic_events
     SET title = ?, cashflow_type = ?, recurrence = ?, due_at = ?, note = ?
     WHERE id = ?`,
    [
      input.title.trim(),
      input.cashflowType,
      input.recurrence,
      input.dueAt,
      input.note?.trim() ? input.note.trim() : null,
      input.eventId,
    ],
  );
}

export function togglePersonalEconomicEventStatus(
  database: SQLite.SQLiteDatabase,
  input: { eventId: string; status: 'todo' | 'done' },
) {
  const event = database.getFirstSync<{ recurrence: 'none' | 'monthly'; due_at: string; status: 'todo' | 'done' }>(
    'SELECT recurrence, due_at, status FROM personal_economic_events WHERE id = ?',
    [input.eventId],
  );

  if (!event) {
    return;
  }

  if (event.recurrence === 'monthly' && event.status === 'todo' && input.status === 'done') {
    database.runSync('UPDATE personal_economic_events SET due_at = ?, status = ? WHERE id = ?', [
      advanceOneMonth(event.due_at),
      'todo',
      input.eventId,
    ]);
    return;
  }

  database.runSync('UPDATE personal_economic_events SET status = ? WHERE id = ?', [input.status, input.eventId]);
}

export function deletePersonalEconomicEvent(database: SQLite.SQLiteDatabase, input: { eventId: string }) {
  database.runSync('DELETE FROM personal_economic_events WHERE id = ?', [input.eventId]);
}

function advanceOneMonth(isoDate: string) {
  const nextDate = new Date(isoDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate.toISOString().slice(0, 10);
}
