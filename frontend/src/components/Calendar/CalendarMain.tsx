import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { EventContentArg } from '@fullcalendar/core';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, addDays } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { useEvents, useUpdateEvent } from '../../hooks/useEvents';
import { getTimezone } from '../../utils/timezone';
import EventChip from './EventChip';
import CurrentTimeLine from './CurrentTimeLine';
import type { CalendarEvent, UpdateEventPayload } from '../../types';
import toast from 'react-hot-toast';

interface CalendarMainProps {
  onDateSelect: (start: Date, end: Date, allDay: boolean, jsEvent?: MouseEvent) => void;
  onEventClick: (event: CalendarEvent, jsEvent: MouseEvent) => void;
}

const CalendarMain: React.FC<CalendarMainProps> = ({ onDateSelect, onEventClick }) => {
  const calendarRef = useRef<FullCalendar>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { currentDate, selectedView, calendarVisibility, timeFormat, weekStartsOn } = useCalendarStore();
  const updateEventMutation = useUpdateEvent();

  // Calculate date range for fetching events
  const dateRange = useMemo(() => {
    const start = subDays(startOfWeek(startOfMonth(currentDate)), 7);
    const end = addDays(endOfWeek(endOfMonth(currentDate)), 7);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [currentDate]);

  const { data: events = [] } = useEvents(dateRange.start, dateRange.end);

  // Sync FullCalendar view/date with Zustand store
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(selectedView);
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate, selectedView]);

  // Filter events based on calendar visibility
  const filteredEvents = useMemo(() => {
    return events.filter((event: CalendarEvent) => {
      return calendarVisibility[event.calendarId] !== false;
    });
  }, [events, calendarVisibility]);

  // Map CalendarEvent[] to FullCalendar EventInput[]
  const fcEvents: EventInput[] = useMemo(() => {
    return filteredEvents.map((event: CalendarEvent) => {
      const color = event.color || event.calendar?.color || '#1a73e8';
      return {
        id: event.id,
        title: event.title || '(No title)',
        start: event.startUtc,
        end: event.endUtc,
        allDay: event.isAllDay,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          ...event,
          color,
        },
      };
    });
  }, [filteredEvents]);

  // Debounced event update for drag/resize
  const debouncedUpdate = useCallback(
    (payload: UpdateEventPayload) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        updateEventMutation.mutate(
          { payload },
          {
            onError: (error: Error & { response?: { status?: number } }) => {
              if (error.response?.status === 409) {
                toast.error('Conflict: This event was modified by another user. Please refresh.');
              }
            },
          }
        );
      }, 300);
    },
    [updateEventMutation]
  );

  const handleEventDrop = useCallback(
    (dropInfo: EventDropArg) => {
      const { event, revert } = dropInfo;
      const originalEvent = event.extendedProps as CalendarEvent;

      if (!event.start) {
        revert();
        return;
      }

      const payload: UpdateEventPayload = {
        id: originalEvent.id,
        version: originalEvent.version,
        startUtc: event.start.toISOString(),
        endUtc: (event.end || event.start).toISOString(),
        isAllDay: event.allDay,
        timezone: getTimezone(),
      };

      debouncedUpdate(payload);
    },
    [debouncedUpdate]
  );

  const handleEventResize = useCallback(
    (resizeInfo: EventResizeDoneArg) => {
      const { event } = resizeInfo;
      const originalEvent = event.extendedProps as CalendarEvent;

      if (!event.start || !event.end) {
        return;
      }

      const payload: UpdateEventPayload = {
        id: originalEvent.id,
        version: originalEvent.version,
        startUtc: event.start.toISOString(),
        endUtc: event.end.toISOString(),
        timezone: getTimezone(),
      };

      debouncedUpdate(payload);
    },
    [debouncedUpdate]
  );

  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      onDateSelect(selectInfo.start, selectInfo.end, selectInfo.allDay, selectInfo.jsEvent || undefined);
      // Clear selection
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.unselect();
    },
    [onDateSelect]
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const calEvent = clickInfo.event.extendedProps as CalendarEvent;
      onEventClick(calEvent, clickInfo.jsEvent);
    },
    [onEventClick]
  );

  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    return <EventChip eventInfo={eventInfo} />;
  }, []);

  const timeFormatObj = useMemo(() => ({
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: timeFormat === '12h',
    meridiem: timeFormat === '12h' ? 'short' as const : false,
  }), [timeFormat]);

  return (
    <div className="flex-1 h-full overflow-hidden">
      <CurrentTimeLine />
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={selectedView}
        initialDate={currentDate}
        firstDay={weekStartsOn}
        headerToolbar={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        droppable={true}
        eventResizableFromStart={true}
        nowIndicator={true}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={timeFormatObj}
        allDaySlot={true}
        allDayText=""
        height="100%"
        dayMaxEvents={3}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '09:00',
          endTime: '17:00',
        }}
        weekNumbers={false}
        events={fcEvents}
        eventContent={renderEventContent}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventTimeFormat={timeFormatObj}
        snapDuration="00:15:00"
        selectMinDistance={5}
        eventMaxStack={4}
        dayHeaderFormat={{
          weekday: 'short',
          day: 'numeric',
          omitCommas: true,
        }}
        scrollTime="08:00:00"
        stickyHeaderDates={true}
      />
    </div>
  );
};

export default CalendarMain;
