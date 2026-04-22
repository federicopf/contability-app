import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import { listAccounts, type AccountListItem } from './accountRepository';

export function useAccounts() {
  const { database, revision, refreshData } = useDatabase();
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);

  useEffect(() => {
    setAccounts(listAccounts(database));
  }, [database, revision]);

  return {
    accounts,
    refreshAccounts: refreshData,
  };
}