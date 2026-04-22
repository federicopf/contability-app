import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import { listObligations, type ObligationListItem } from './obligationRepository';

export function useObligations() {
  const { database, revision } = useDatabase();
  const [obligations, setObligations] = useState<ObligationListItem[]>([]);

  useEffect(() => {
    setObligations(listObligations(database));
  }, [database, revision]);

  return { obligations };
}