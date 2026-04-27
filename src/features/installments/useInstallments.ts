import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import { listInstallments, type InstallmentListItem } from './installmentRepository';

export function useInstallments() {
  const { database, revision } = useDatabase();
  const [installments, setInstallments] = useState<InstallmentListItem[]>([]);

  useEffect(() => {
    setInstallments(listInstallments(database));
  }, [database, revision]);

  return { installments };
}