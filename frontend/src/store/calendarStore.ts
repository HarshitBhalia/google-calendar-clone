import { create } from 'zustand';
import type { CalendarView, CreateEventPayload, User } from '../types';

interface CalendarStore {
  // Navigation
  currentDate: Date;
  selectedView: CalendarView;
  sidebarOpen: boolean;

  // Auth
  token: string | null;
  user: User | null;

  // Calendar visibility
  calendarVisibility: Record<string, boolean>;

  // Draft event
  draftEvent: Partial<CreateEventPayload> | null;

  // Actions
  setCurrentDate: (date: Date) => void;
  setSelectedView: (view: CalendarView) => void;
  toggleSidebar: () => void;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  setCalendarVisibility: (calendarId: string, visible: boolean) => void;
  setDraftEvent: (draft: Partial<CreateEventPayload> | null) => void;
  clearDraftEvent: () => void;

  // Settings
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
  defaultDuration: number; // minutes
  setDefaultDuration: (duration: number) => void;
  weekStartsOn: number; // 0 for Sunday, 1 for Monday, etc.
  setWeekStartsOn: (day: number) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const getInitialSetting = <T,>(key: string, defaultVal: T, parser?: (val: string) => T): T => {
  try {
    const stored = localStorage.getItem(`gc-${key}`);
    if (stored !== null) {
      return parser ? parser(stored) : (stored as unknown as T);
    }
  } catch (e) {
    // Ignore
  }
  return defaultVal;
};

export const useCalendarStore = create<CalendarStore>((set) => ({
  // State
  currentDate: new Date(),
  selectedView: 'timeGridWeek',
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  token: null,
  user: null,
  calendarVisibility: {},
  draftEvent: null,
  timeFormat: getInitialSetting<'12h' | '24h'>('time-format', '12h'),
  defaultDuration: getInitialSetting<number>('default-duration', 60, parseInt),
  weekStartsOn: getInitialSetting<number>('week-starts-on', 0, parseInt),
  theme: getInitialSetting<'light' | 'dark' | 'system'>('theme', 'light'),

  // Actions
  setCurrentDate: (date: Date) => set({ currentDate: date }),

  setSelectedView: (view: CalendarView) => set({ selectedView: view }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setAuth: (token: string, user: User) => set({ token, user }),

  clearAuth: () => set({ token: null, user: null }),

  toggleCalendarVisibility: (calendarId: string) =>
    set((state) => ({
      calendarVisibility: {
        ...state.calendarVisibility,
        [calendarId]: state.calendarVisibility[calendarId] === false ? true : false,
      },
    })),

  setCalendarVisibility: (calendarId: string, visible: boolean) =>
    set((state) => ({
      calendarVisibility: {
        ...state.calendarVisibility,
        [calendarId]: visible,
      },
    })),

  setDraftEvent: (draft: Partial<CreateEventPayload> | null) => set({ draftEvent: draft }),

  clearDraftEvent: () => set({ draftEvent: null }),

  setTimeFormat: (format: '12h' | '24h') => {
    set({ timeFormat: format });
    try {
      localStorage.setItem('gc-time-format', format);
    } catch (e) {}
  },
  
  setDefaultDuration: (duration: number) => {
    set({ defaultDuration: duration });
    try {
      localStorage.setItem('gc-default-duration', duration.toString());
    } catch (e) {}
  },

  setWeekStartsOn: (day: number) => {
    set({ weekStartsOn: day });
    try {
      localStorage.setItem('gc-week-starts-on', day.toString());
    } catch (e) {}
  },
  
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
    try {
      localStorage.setItem('gc-theme', theme);
    } catch (e) {}
  },
}));
