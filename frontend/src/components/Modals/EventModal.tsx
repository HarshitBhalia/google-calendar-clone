import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  MapPin,
  AlignLeft,
  Clock,
  Repeat,
  Check,
  Loader2,
} from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useCalendars } from '../../hooks/useEvents';
import { useCalendarStore } from '../../store/calendarStore';
import {
  getTimezone,
  toLocalISODate,
  toLocalISOTime,
  combineDateAndTime,
} from '../../utils/timezone';
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload, OverlapWarning } from '../../types';

const EVENT_COLORS = [
  { name: 'Tomato', value: '#d93025' },
  { name: 'Flamingo', value: '#e67c73' },
  { name: 'Tangerine', value: '#f4511e' },
  { name: 'Banana', value: '#f6bf26' },
  { name: 'Sage', value: '#33b679' },
  { name: 'Basil', value: '#0b8043' },
  { name: 'Peacock', value: '#039be5' },
  { name: 'Blueberry', value: '#3f51b5' },
  { name: 'Lavender', value: '#7986cb' },
  { name: 'Grape', value: '#8e24aa' },
  { name: 'Graphite', value: '#616161' },
];

const RECURRENCE_OPTIONS = [
  { label: 'Does not repeat', value: '' },
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekly', value: 'FREQ=WEEKLY' },
  { label: 'Monthly', value: 'FREQ=MONTHLY' },
  { label: 'Yearly', value: 'FREQ=YEARLY' },
];

const DRAFT_STORAGE_KEY = 'gc-event-draft';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: CalendarEvent | null;
  initialStart?: Date;
  initialEnd?: Date;
  onOverlapWarning: (warning: OverlapWarning, payload: CreateEventPayload | UpdateEventPayload, isEdit: boolean) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  editEvent,
  initialStart,
  initialEnd,
  onOverlapWarning,
}) => {
  const { data: calendars = [] } = useCalendars();
  const { defaultDuration } = useCalendarStore();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultStart = initialStart || new Date();
  const defaultEnd = initialEnd || new Date(defaultStart.getTime() + defaultDuration * 60 * 1000);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(toLocalISODate(defaultStart));
  const [startTime, setStartTime] = useState(toLocalISOTime(defaultStart));
  const [endDate, setEndDate] = useState(toLocalISODate(defaultEnd));
  const [endTime, setEndTime] = useState(toLocalISOTime(defaultEnd));
  const [isAllDay, setIsAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  const isEditing = !!editEvent;

  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (editEvent) {
      setTitle(editEvent.title || '');
      const start = new Date(editEvent.startUtc);
      const end = new Date(editEvent.endUtc);
      setStartDate(toLocalISODate(start));
      setStartTime(toLocalISOTime(start));
      setEndDate(toLocalISODate(end));
      setEndTime(toLocalISOTime(end));
      setIsAllDay(editEvent.isAllDay);
      setCalendarId(editEvent.calendarId);
      setLocation(editEvent.location || '');
      setDescription(editEvent.description || '');
      setColor(editEvent.color || '');
      setRecurrenceRule(editEvent.recurrenceRule || '');
      setHasDraft(false);
    } else {
      // Check for saved draft
      try {
        const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          setHasDraft(true);
        }
      } catch {
        // Ignore sessionStorage errors
      }

      setTitle('');
      const s = initialStart || new Date();
      const e = initialEnd || new Date(s.getTime() + defaultDuration * 60 * 1000);
      setStartDate(toLocalISODate(s));
      setStartTime(toLocalISOTime(s));
      setEndDate(toLocalISODate(e));
      setEndTime(toLocalISOTime(e));
      setIsAllDay(false);
      setCalendarId(calendars[0]?.id || '');
      setLocation('');
      setDescription('');
      setColor('');
      setRecurrenceRule('');
    }

    // Focus title input
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [isOpen, editEvent, initialStart, initialEnd, calendars, defaultDuration]);

  // Set default calendar when calendars load
  useEffect(() => {
    if (!calendarId && calendars.length > 0 && !editEvent) {
      setCalendarId(calendars[0].id);
    }
  }, [calendars, calendarId, editEvent]);

  // Auto-save draft every 2 seconds
  useEffect(() => {
    if (!isOpen || isEditing) return;

    draftTimerRef.current = setInterval(() => {
      const draft = {
        title,
        startDate,
        startTime,
        endDate,
        endTime,
        isAllDay,
        calendarId,
        location,
        description,
        color,
        recurrenceRule,
      };
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // Ignore
      }
    }, 2000);

    return () => {
      if (draftTimerRef.current) {
        clearInterval(draftTimerRef.current);
      }
    };
  }, [isOpen, isEditing, title, startDate, startTime, endDate, endTime, isAllDay, calendarId, location, description, color, recurrenceRule]);

  const restoreDraft = useCallback(() => {
    try {
      const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setStartDate(draft.startDate || startDate);
        setStartTime(draft.startTime || startTime);
        setEndDate(draft.endDate || endDate);
        setEndTime(draft.endTime || endTime);
        setIsAllDay(draft.isAllDay || false);
        setCalendarId(draft.calendarId || calendarId);
        setLocation(draft.location || '');
        setDescription(draft.description || '');
        setColor(draft.color || '');
        setRecurrenceRule(draft.recurrenceRule || '');
        setHasDraft(false);
      }
    } catch {
      // Ignore
    }
  }, [startDate, startTime, endDate, endTime, calendarId]);

  const dismissDraft = () => {
    setHasDraft(false);
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDt = isAllDay
      ? new Date(`${startDate}T00:00:00`)
      : combineDateAndTime(startDate, startTime);
    const endDt = isAllDay
      ? new Date(`${endDate}T23:59:59`)
      : combineDateAndTime(endDate, endTime);

    if (isEditing && editEvent) {
      const payload: UpdateEventPayload = {
        id: editEvent.id,
        version: editEvent.version,
        title: title || '(No title)',
        description: description || undefined,
        startUtc: startDt.toISOString(),
        endUtc: endDt.toISOString(),
        isAllDay,
        color: color || undefined,
        location: location || undefined,
        calendarId,
        recurrenceRule: recurrenceRule || undefined,
        timezone: getTimezone(),
      };

      updateMutation.mutate(
        { payload },
        {
          onSuccess: () => {
            clearDraft();
            onClose();
          },
          onError: (error: Error & { response?: { status?: number; data?: { overlaps?: CalendarEvent[] } } }) => {
            if (error.response?.status === 409 && error.response.data?.overlaps) {
              onOverlapWarning(
                { warning: true, overlaps: error.response.data.overlaps },
                payload,
                true
              );
            }
          },
        }
      );
    } else {
      const payload: CreateEventPayload = {
        title: title || '(No title)',
        description: description || undefined,
        startUtc: startDt.toISOString(),
        endUtc: endDt.toISOString(),
        isAllDay,
        color: color || undefined,
        location: location || undefined,
        calendarId,
        recurrenceRule: recurrenceRule || undefined,
        timezone: getTimezone(),
      };

      createMutation.mutate(
        { payload },
        {
          onSuccess: () => {
            clearDraft();
            onClose();
          },
          onError: (error: Error & { response?: { status?: number; data?: { overlaps?: CalendarEvent[] } } }) => {
            if (error.response?.status === 409 && error.response.data?.overlaps) {
              onOverlapWarning(
                { warning: true, overlaps: error.response.data.overlaps },
                payload,
                false
              );
            }
          },
        }
      );
    }
  };

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 modal-content overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gc-gray-50 border-b border-gc-gray-200">
          <h2 className="text-lg font-google-sans font-medium text-gc-gray-900">
            {isEditing ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={handleClose}
            className="btn-icon -mr-2"
          >
            <X size={20} className="text-gc-gray-600" />
          </button>
        </div>

        {/* Draft restore banner */}
        {hasDraft && !isEditing && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-gc-blue">You have an unsaved draft</span>
            <div className="flex gap-2">
              <button onClick={restoreDraft} className="text-sm font-medium text-gc-blue hover:underline">
                Restore
              </button>
              <button onClick={dismissDraft} className="text-sm text-gc-gray-600 hover:underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full text-xl font-google-sans text-gc-gray-900 border-0 border-b-2 border-gc-gray-200 focus:border-gc-blue outline-none pb-2 transition-colors placeholder:text-gc-gray-400"
          />

          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gc-gray-700">
              <Clock size={18} className="text-gc-gray-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-base w-auto"
                  />
                  {!isAllDay && (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-base w-auto"
                    />
                  )}
                  <span className="text-gc-gray-400">–</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-base w-auto"
                  />
                  {!isAllDay && (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-base w-auto"
                    />
                  )}
                </div>

                {/* All-day toggle */}
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-gc-gray-300 text-gc-blue focus:ring-gc-blue"
                  />
                  <span className="text-sm text-gc-gray-700">All day</span>
                </label>
              </div>
            </div>

            {/* Recurrence */}
            <div className="flex items-center gap-2">
              <Repeat size={18} className="text-gc-gray-600 flex-shrink-0" />
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                className="input-base w-auto"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendar selector */}
          {calendars.length > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: calendars.find((c) => c.id === calendarId)?.color || '#1a73e8' }}
              />
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="input-base w-auto flex-1"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-gc-gray-600 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="input-base"
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-2">
            <AlignLeft size={18} className="text-gc-gray-600 flex-shrink-0 mt-2" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
              className="input-base resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <p className="text-xs text-gc-gray-600 mb-2 font-medium">Event color</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(color === c.value ? '' : c.value)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {color === c.value && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? 'Save' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
