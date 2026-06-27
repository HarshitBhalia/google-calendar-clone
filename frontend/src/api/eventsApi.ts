import axios from 'axios';
import type {
  CalendarEvent,
  CreateEventPayload,
  UpdateEventPayload,
  AuthResponse,
  User,
  Calendar,
} from '../types';
import { useCalendarStore } from '../store/calendarStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useCalendarStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AUTH =====

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

// ===== EVENTS =====

export async function fetchEvents(start: string, end: string, timezone: string): Promise<CalendarEvent[]> {
  const { data } = await api.get<{ events: CalendarEvent[] }>('/events', {
    params: { start, end, timezone },
  });
  return data.events;
}

export interface SearchQuery {
  q?: string;
  what?: string;
  who?: string;
  where?: string;
  not?: string;
  from?: string;
  to?: string;
  timezone: string;
}

export async function searchEvents(params: SearchQuery): Promise<CalendarEvent[]> {
  const { data } = await api.get<{ events: CalendarEvent[] }>('/events/search', {
    params,
  });
  return data.events;
}

export async function fetchEventById(id: string): Promise<CalendarEvent> {
  const { data } = await api.get<{ event: CalendarEvent }>(`/events/${id}`);
  return data.event;
}

export async function createEvent(
  payload: CreateEventPayload,
  forceOverlap?: boolean
): Promise<CalendarEvent> {
  const { data } = await api.post<{ event: CalendarEvent }>('/events', payload, {
    params: forceOverlap ? { forceOverlap: 'true' } : undefined,
  });
  return data.event;
}

export async function updateEvent(
  payload: UpdateEventPayload,
  forceOverlap?: boolean
): Promise<CalendarEvent> {
  const { id, ...rest } = payload;
  const { data } = await api.put<{ event: CalendarEvent }>(`/events/${id}`, rest, {
    params: forceOverlap ? { forceOverlap: 'true' } : undefined,
  });
  return data.event;
}

export async function deleteEvent(
  id: string,
  deleteMode?: 'this' | 'future' | 'all'
): Promise<void> {
  await api.delete(`/events/${id}`, {
    params: deleteMode ? { mode: deleteMode } : undefined,
  });
}

// ===== CALENDARS =====

export async function fetchCalendars(): Promise<Calendar[]> {
  const { data } = await api.get<{ calendars: Calendar[] }>('/calendars');
  return data.calendars;
}

export async function createCalendar(name: string, color: string): Promise<Calendar> {
  const { data } = await api.post<{ calendar: Calendar }>('/calendars', { name, color });
  return data.calendar;
}

export async function updateCalendar(id: string, name: string, color: string): Promise<Calendar> {
  const { data } = await api.put<{ calendar: Calendar }>(`/calendars/${id}`, { name, color });
  return data.calendar;
}

export async function deleteCalendar(id: string): Promise<void> {
  await api.delete(`/calendars/${id}`);
}

export default api;
