/** Lightweight unique id generator — good enough for local primary keys, no crypto dependency needed. */
export function generateId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${timestamp}-${random}`;
}
