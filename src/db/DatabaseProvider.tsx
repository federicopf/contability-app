import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type * as SQLite from 'expo-sqlite';

import { getDatabase, initializeDatabase } from './database';
import { colors, spacing, typography } from '../theme/tokens';

type DatabaseContextValue = {
  database: SQLite.SQLiteDatabase;
  revision: number;
  refreshData: () => void;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    try {
      const db = initializeDatabase();
      setDatabase(db);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto nel bootstrap SQLite.';
      setErrorMessage(message);
    }
  }, []);

  const contextValue = useMemo(() => {
    if (!database) {
      return null;
    }

    return {
      database,
      revision,
      refreshData: () => {
        setRevision((currentValue) => currentValue + 1);
      },
    };
  }, [database, revision]);

  if (errorMessage) {
    return (
      <View style={styles.stateScreen}>
        <Text style={styles.stateTitle}>Bootstrap database non riuscito</Text>
        <Text style={styles.stateBody}>{errorMessage}</Text>
      </View>
    );
  }

  if (!contextValue) {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.stateTitle}>Sto preparando i tuoi dati</Text>
        <Text style={styles.stateBody}>Inizializzo lo storage locale dell'app.</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={contextValue}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);

  if (!context) {
    return {
      database: getDatabase(),
      revision: 0,
      refreshData: () => undefined,
    };
  }

  return context;
}

const styles = StyleSheet.create({
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stateTitle: {
    fontFamily: typography.title,
    fontSize: 22,
    color: colors.textPrimary,
  },
  stateBody: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});