import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchEvents,
  searchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchCalendars,
  createCalendar,
} from '../api/eventsApi';
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload } from '../types';
import { getTimezone } from '../utils/timezone';
import toast from 'react-hot-toast';

export function useEvents(start: string, end: string) {
  const timezone = getTimezone();

  return useQuery({
    queryKey: ['events', start, end],
    queryFn: () => fetchEvents(start, end, timezone),
    enabled: !!start && !!end,
    staleTime: 30 * 1000,
  });
}

import type { SearchQuery } from '../api/eventsApi';

export function useSearchEvents(params: Omit<SearchQuery, 'timezone'>) {
  const timezone = getTimezone();

  return useQuery({
    queryKey: ['searchEvents', params],
    queryFn: () => searchEvents({ ...params, timezone }),
    enabled: Object.values(params).some((val) => val && val.trim().length > 0),
    staleTime: 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      forceOverlap,
    }: {
      payload: CreateEventPayload;
      forceOverlap?: boolean;
    }) => createEvent(payload, forceOverlap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created');
    },
    onError: (error: Error & { response?: { status?: number; data?: { overlaps?: CalendarEvent[]; message?: string } } }) => {
      if (error.response?.status !== 409) {
        const message = error.response?.data?.message || 'Failed to create event';
        toast.error(message);
      }
      // 409 is handled by the caller to show overlap warning
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      forceOverlap,
    }: {
      payload: UpdateEventPayload;
      forceOverlap?: boolean;
    }) => updateEvent(payload, forceOverlap),
    onMutate: async ({ payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events'] });

      // Snapshot all event queries for rollback
      const previousQueries = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: ['events'] });

      // Optimistic update: patch matching events in all cached queries
      queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ['events'] }, (old) => {
        if (!old) return old;
        return old.map((event) => {
          if (event.id === payload.id) {
            return {
              ...event,
              ...payload,
              startUtc: payload.startUtc ?? event.startUtc,
              endUtc: payload.endUtc ?? event.endUtc,
              title: payload.title ?? event.title,
              version: event.version + 1,
              updatedAt: new Date().toISOString(),
            };
          }
          return event;
        });
      });

      return { previousQueries };
    },
    onError: (
      error: Error & { response?: { status?: number; data?: { overlaps?: CalendarEvent[]; message?: string } } },
      _variables,
      context
    ) => {
      // Revert optimistic update
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }

      if (error.response?.status === 409) {
        // Conflict — handled by caller (version conflict or overlap)
        return;
      }

      const message = error.response?.data?.message || 'Failed to update event';
      toast.error(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated');
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, deleteMode }: { id: string; deleteMode?: 'this' | 'future' | 'all' }) =>
      deleteEvent(id, deleteMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to delete event';
      toast.error(message);
    },
  });
}

export function useCalendars() {
  return useQuery({
    queryKey: ['calendars'],
    queryFn: fetchCalendars,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createCalendar(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      toast.success('Calendar created');
    },
    onError: () => {
      toast.error('Failed to create calendar');
    },
  });
}
