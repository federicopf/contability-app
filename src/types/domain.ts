export type AccountType = 'cash' | 'card';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ObligationType = 'debt' | 'credit';

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: 'EUR';
};

export type LedgerTransaction = {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  bookedAt: string;
};

export type Obligation = {
  id: string;
  type: ObligationType;
  counterparty: string;
  amount: number;
  dueAt: string;
  status: 'open' | 'closed';
};

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  nextBillingDate: string;
  active: boolean;
  accountId?: string | null;
};

export type InstallmentPlan = {
  id: string;
  name: string;
  cashflowType: 'income' | 'expense';
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  nextDueDate: string;
  active: boolean;
  accountId?: string | null;
};

export type PersonalEconomicEvent = {
  id: string;
  title: string;
  cashflowType: 'income' | 'expense';
  recurrence: 'none' | 'monthly';
  dueAt: string;
  status: 'todo' | 'done';
  note?: string | null;
};