const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact Italian relative-time label, e.g. "5 min fa", "ieri", "3 giorni fa". */
export function formatRelativeTime(timestamp: number | null, now: number = Date.now()): string {
  if (timestamp === null) return 'Mai aggiornato';
  const diff = now - timestamp;
  if (diff < MINUTE) return 'Adesso';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min fa`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h fa`;
  if (diff < 2 * DAY) return 'Ieri';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} giorni fa`;
  return formatDate(timestamp);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
