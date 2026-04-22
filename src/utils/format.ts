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
    case 'bank':
      return 'Banca';
    case 'wallet':
      return 'Wallet';
    default:
      return 'Altro';
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