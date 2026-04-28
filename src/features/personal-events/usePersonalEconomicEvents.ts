import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import { listPersonalEconomicEvents } from './personalEventRepository';
import type { PersonalEconomicEvent } from '../../types/domain';

export function usePersonalEconomicEvents() {
  const { database, revision } = useDatabase();
  const [events, setEvents] = useState<PersonalEconomicEvent[]>([]);

  useEffect(() => {
    setEvents(listPersonalEconomicEvents(database));
  }, [database, revision]);

  return { events };
}
