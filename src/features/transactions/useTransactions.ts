import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import { listTransactions, type TransactionListItem } from './transactionRepository';

export function useTransactions() {
  const { database, revision, refreshData } = useDatabase();
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);

  useEffect(() => {
    setTransactions(listTransactions(database));
  }, [database, revision]);

  return {
    transactions,
    refreshTransactions: refreshData,
  };
}