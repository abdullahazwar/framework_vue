export function dateKey(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const year = Number(value.slice(0, 4));
  if (year < 1900 || year > 2199) return false;
  const date = new Date(value + 'T12:00:00');
  return Number.isFinite(date.getTime()) && dateKey(date) === value;
}

export function addDays(value: string, amount: number): string {
  if (!isDateKey(value)) throw new Error('Tanggal tidak valid.');
  const date = new Date(value + 'T12:00:00');
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function startOfWeek(value: string): string {
  const day = new Date(value + 'T12:00:00').getDay();
  return addDays(value, -(day === 0 ? 6 : day - 1));
}

export function formatDate(
  value: string | null,
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (!value) return 'Tanpa tenggat';
  if (!isDateKey(value)) return 'Tanggal tidak valid';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    ...options,
  }).format(new Date(value + 'T12:00:00'));
}

export function formatMoment(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function isOverdue(
  dueDate: string | null,
  status: string,
  today: string,
): boolean {
  return Boolean(dueDate && dueDate < today && status !== 'done');
}
