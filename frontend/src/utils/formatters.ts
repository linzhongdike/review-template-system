import dayjs from 'dayjs';

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD');
}

export function formatVersion(v: string | null | undefined): string {
  if (!v) return '-';
  return `V${v}`;
}
