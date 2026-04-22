import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import { listSubscriptions, type SubscriptionListItem } from './subscriptionRepository';

export function useSubscriptions() {
  const { database, revision } = useDatabase();
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);

  useEffect(() => {
    setSubscriptions(listSubscriptions(database));
  }, [database, revision]);

  return { subscriptions };
}