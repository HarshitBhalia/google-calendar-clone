import { format, isToday, isTomorrow, isYesterday, isSameDay } from 'date-fns';

/**
 * Convert a UTC ISO string to a local Date object.
 */
export function utcToLocal(utcIso: string): Date {
  return new Date(utcIso);
}

/**
 * Format a Date to a time string like "10:00 AM".
 */
export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Format a date range into a human-readable string.
 * Examples:
 * - Same day: "Friday, June 27 · 10:00 AM – 11:00 AM"
 * - Different days: "Jun 27, 10:00 AM – Jun 28, 11:00 AM"
 */
export function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    let dayLabel = format(start, 'EEEE, MMMM d');
    if (isToday(start)) {
      dayLabel = 'Today';
    } else if (isTomorrow(start)) {
      dayLabel = 'Tomorrow';
    } else if (isYesterday(start)) {
      dayLabel = 'Yesterday';
    }
    return `${dayLabel} · ${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${format(start, 'MMM d')}, ${formatTime(start)} – ${format(end, 'MMM d')}, ${formatTime(end)}`;
}

/**
 * Get the user's IANA timezone string using Intl API.
 */
export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Format a date to ISO string in local timezone for date inputs.
 */
export function toLocalISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a date to HH:mm for time inputs.
 */
export function toLocalISOTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Combine a date string and time string into a Date object.
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}
