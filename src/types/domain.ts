export type AccountType = 'cash' | 'card' | 'bank' | 'wallet' | 'other';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ObligationType = 'debt' | 'credit';

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
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
  status: 'open' | 'partial' | 'closed';
};

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  nextBillingDate: string;
  active: boolean;
};