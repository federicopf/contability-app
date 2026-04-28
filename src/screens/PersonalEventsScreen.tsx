import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '../components/AppScreen';
import { useDatabase } from '../db/DatabaseProvider';
import {
  createPersonalEconomicEvent,
  deletePersonalEconomicEvent,
  togglePersonalEconomicEventStatus,
  updatePersonalEconomicEvent,
} from '../features/personal-events/personalEventRepository';
import { usePersonalEconomicEvents } from '../features/personal-events/usePersonalEconomicEvents';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { todayIsoDate } from '../utils/date';
import { formatDate } from '../utils/format';

export function PersonalEventsScreen() {
  const { database, refreshData } = useDatabase();
  const { events } = usePersonalEconomicEvents();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [cashflowType, setCashflowType] = useState<'income' | 'expense'>('expense');
  const [recurrence, setRecurrence] = useState<'none' | 'monthly'>('none');
  const [dueAt, setDueAt] = useState(todayIsoDate());
  const [note, setNote] = useState('');
  const [showClosed, setShowClosed] = useState(false);

  const today = todayIsoDate();
  const futureTodoEvents = useMemo(
    () => events.filter((event) => event.status === 'todo' && event.dueAt >= today).sort((a, b) => (a.dueAt > b.dueAt ? 1 : -1)),
    [events, today],
  );
  const closedEvents = useMemo(
    () => events.filter((event) => event.status === 'done').sort((a, b) => (a.dueAt < b.dueAt ? 1 : -1)),
    [events],
  );

  const saveEvent = () => {
    if (!title.trim()) return;

    if (editingId) {
      updatePersonalEconomicEvent(database, {
        eventId: editingId,
        title,
        cashflowType,
        recurrence,
        dueAt,
        note,
      });
    } else {
      createPersonalEconomicEvent(database, {
        title,
        cashflowType,
        recurrence,
        dueAt,
        note,
      });
    }

    clearForm();
    refreshData();
    setShowAddForm(false);
  };

  const clearForm = () => {
    setEditingId(null);
    setTitle('');
    setCashflowType('expense');
    setRecurrence('none');
    setDueAt(todayIsoDate());
    setNote('');
  };

  const startEditing = (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    setEditingId(event.id);
    setTitle(event.title);
    setCashflowType(event.cashflowType);
    setRecurrence(event.recurrence);
    setDueAt(event.dueAt);
    setNote(event.note ?? '');
    setShowAddForm(true);
  };

  const toggleDone = (eventId: string, status: 'todo' | 'done') => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    togglePersonalEconomicEventStatus(database, {
      eventId,
      status: status === 'done' ? 'todo' : 'done',
    });

    refreshData();
  };

  const removeEvent = (eventId: string) => {
    deletePersonalEconomicEvent(database, { eventId });
    if (editingId === eventId) {
      clearForm();
    }
    refreshData();
  };

  const addButton = (
    <Pressable onPress={() => setShowAddForm(true)} style={styles.plusBtn}>
      <MaterialIcons name="add" size={20} color={colors.accent} />
    </Pressable>
  );

  return (
    <>
      <AppScreen
        eyebrow="Eventi"
        title="Eventi economici personali"
        actionButton={addButton}
      >
        <View style={styles.compactCard}>
          <Text style={styles.cardTitle}>Da fare future</Text>
          {futureTodoEvents.length > 0 ? (
            futureTodoEvents.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <Pressable style={styles.eventMain} onPress={() => toggleDone(event.id, event.status)}>
                  <Text style={[styles.eventBadge, event.cashflowType === 'income' ? styles.incomeBadge : styles.expenseBadge]}>
                    {event.cashflowType === 'income' ? 'Entrata' : 'Uscita'}
                  </Text>
                  <View style={styles.eventTextCol}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventMeta}>Previsto il {formatDate(event.dueAt)}</Text>
                    {event.recurrence === 'monthly' ? <Text style={styles.eventMeta}>Ricorrente mensile</Text> : null}
                    {event.note ? <Text style={styles.eventMeta}>{event.note}</Text> : null}
                  </View>
                </Pressable>
                <View style={styles.actionsCol}>
                  <Pressable onPress={() => startEditing(event.id)} style={styles.inlineAction}>
                    <Text style={styles.inlineActionLabel}>Modifica</Text>
                  </Pressable>
                  <Pressable onPress={() => removeEvent(event.id)} style={styles.inlineDangerAction}>
                    <Text style={styles.inlineDangerLabel}>Elimina</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Nessun evento futuro da fare.</Text>
          )}
        </View>

        <View style={styles.compactCard}>
          <Pressable onPress={() => setShowClosed((currentValue) => !currentValue)} style={styles.dropdownHeader}>
            <Text style={styles.cardTitle}>Chiuse ({closedEvents.length})</Text>
            <Text style={styles.dropdownIcon}>{showClosed ? '▲' : '▼'}</Text>
          </Pressable>

          {showClosed ? (
            closedEvents.length > 0 ? (
              closedEvents.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <Pressable style={styles.eventMain} onPress={() => toggleDone(event.id, event.status)}>
                    <Text style={[styles.eventBadge, event.cashflowType === 'income' ? styles.incomeBadge : styles.expenseBadge]}>
                      {event.cashflowType === 'income' ? 'Entrata' : 'Uscita'}
                    </Text>
                    <View style={styles.eventTextCol}>
                      <Text style={[styles.eventTitle, styles.eventDone]}>{event.title}</Text>
                      <Text style={styles.eventMeta}>Data: {formatDate(event.dueAt)}</Text>
                      {event.recurrence === 'monthly' ? <Text style={styles.eventMeta}>Ricorrente mensile</Text> : null}
                      {event.note ? <Text style={styles.eventMeta}>{event.note}</Text> : null}
                    </View>
                  </Pressable>
                  <View style={styles.actionsCol}>
                    <Pressable onPress={() => startEditing(event.id)} style={styles.inlineAction}>
                      <Text style={styles.inlineActionLabel}>Modifica</Text>
                    </Pressable>
                    <Pressable onPress={() => removeEvent(event.id)} style={styles.inlineDangerAction}>
                      <Text style={styles.inlineDangerLabel}>Elimina</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Nessun evento chiuso.</Text>
            )
          ) : null}
        </View>
      </AppScreen>

      <Modal visible={showAddForm} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Modifica evento' : 'Nuovo evento'}</Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.rowGap}>
              {(['expense', 'income'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setCashflowType(t)}
                  style={[styles.chip, cashflowType === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, cashflowType === t && styles.chipTextActive]}>
                    {t === 'expense' ? 'Uscita' : 'Entrata'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.rowGap}>
              {(['none', 'monthly'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRecurrence(r)}
                  style={[styles.chip, recurrence === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, recurrence === r && styles.chipTextActive]}>
                    {r === 'none' ? 'Singolo' : 'Ogni mese'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              onChangeText={setTitle}
              placeholder="Titolo"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={title}
            />
            <TextInput
              onChangeText={setDueAt}
              placeholder="Data prevista (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={dueAt}
            />
            <TextInput
              onChangeText={setNote}
              placeholder={recurrence === 'monthly' ? 'Nota ricorrente' : 'Nota (opzionale)'}
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={note}
            />

            <View style={styles.rowGap}>
              <Pressable onPress={saveEvent} style={[styles.btn, styles.btnFlex]}>
                <Text style={styles.btnText}>{editingId ? 'Aggiorna evento' : 'Salva evento'}</Text>
              </Pressable>
              {editingId && (
                <Pressable onPress={() => setShowAddForm(false)} style={[styles.btn, styles.btnSecondary, styles.btnFlex]}>
                  <Text style={styles.btnSecondaryText}>Annulla</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownIcon: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  eventMain: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  eventTextCol: {
    flex: 1,
    gap: 2,
  },
  eventBadge: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: typography.bodyStrong,
    fontSize: 11,
    color: colors.textPrimary,
  },
  incomeBadge: {
    backgroundColor: '#dff1e7',
  },
  expenseBadge: {
    backgroundColor: '#f8e2df',
  },
  eventTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eventDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  eventMeta: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  inlineAction: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
  },
  inlineActionLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.textPrimary,
  },
  inlineDangerAction: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  inlineDangerLabel: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.danger,
  },
  empty: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowGap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelMuted,
  },
  chipActive: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.panelStrong,
  },
  chipText: {
    fontFamily: typography.bodyStrong,
    fontSize: 12,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  input: {
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  btn: {
    backgroundColor: colors.panelStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    alignItems: 'center',
  },
  btnFlex: {
    flex: 1,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
    color: colors.textInverse,
  },
  btnSecondaryText: {
    fontFamily: typography.bodyStrong,
    fontSize: 13,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
  },
});
