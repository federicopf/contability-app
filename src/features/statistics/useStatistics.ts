import { useEffect, useState } from 'react';

import { useDatabase } from '../../db/DatabaseProvider';
import {
  getStatisticsSnapshot,
  type AccountBreakdownItem,
  type CategoryBreakdownItem,
  type PeriodSnapshot,
} from './statisticsRepository';

type StatisticsSnapshot = {
  currentMonth: PeriodSnapshot;
  previousMonth: PeriodSnapshot;
  currentYear: PeriodSnapshot;
  topExpenseCategories: CategoryBreakdownItem[];
  accountBalances: AccountBreakdownItem[];
};

const emptySnapshot: StatisticsSnapshot = {
  currentMonth: { income: 0, expense: 0, net: 0, transactionsCount: 0 },
  previousMonth: { income: 0, expense: 0, net: 0, transactionsCount: 0 },
  currentYear: { income: 0, expense: 0, net: 0, transactionsCount: 0 },
  topExpenseCategories: [],
  accountBalances: [],
};

export function useStatistics() {
  const { database, revision } = useDatabase();
  const [snapshot, setSnapshot] = useState<StatisticsSnapshot>(emptySnapshot);

  useEffect(() => {
    setSnapshot(getStatisticsSnapshot(database));
  }, [database, revision]);

  return snapshot;
}