export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  color?: string;
  location?: string;
  calendarId: string;
  userId: string;
  recurrenceRule?: string;
  recurrenceId?: string;
  isException: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  calendar?: Calendar;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  color?: string;
  location?: string;
  calendarId: string;
  recurrenceRule?: string;
  timezone: string;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: string;
  version: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export interface OverlapWarning {
  warning: boolean;
  overlaps: CalendarEvent[];
}
