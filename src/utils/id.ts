export function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}
