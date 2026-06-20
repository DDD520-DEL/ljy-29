import { TimePeriod, Direction, DIRECTION_LABELS } from '@/types';

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationWithHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}时${mins}分${secs}秒`;
  }
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}

export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 7 && hour < 9) return 'morning_peak';
  if (hour >= 17 && hour < 19) return 'evening_peak';
  if (hour >= 6 && hour < 22) return 'flat';
  return 'night';
}

export function getTimePeriodFromDate(date: Date): TimePeriod {
  return getTimePeriod(date.getHours());
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getDirectionLabel(direction: Direction): string {
  return DIRECTION_LABELS[direction];
}

export function getDirectionEmoji(direction: Direction): string {
  const emojis: Record<Direction, string> = {
    east: '➡️',
    south: '⬇️',
    west: '⬅️',
    north: '⬆️',
  };
  return emojis[direction];
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getDaysAgoDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}
