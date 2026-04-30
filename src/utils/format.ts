export function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatAccountType(type: string) {
  switch (type) {
    case 'cash':
      return 'Contanti';
    case 'card':
      return 'Carta';
    default:
      return 'Contanti';
  }
}

export function formatTransactionType(type: string) {
  switch (type) {
    case 'income':
      return 'Entrata';
    case 'expense':
      return 'Uscita';
    case 'transfer':
      return 'Trasferimento';
    default:
      return type;
  }
}

export function formatObligationType(type: string) {
  return type === 'credit' ? 'Credito' : 'Debito';
}

export function formatSubscriptionFrequency(frequency: string) {
  switch (frequency) {
    case 'weekly':
      return 'Settimanale';
    case 'monthly':
      return 'Mensile';
    case 'quarterly':
      return 'Trimestrale';
    case 'yearly':
      return 'Annuale';
    default:
      return frequency;
  }
}