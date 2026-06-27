import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Users, Video, MapPin, AlignLeft, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useCalendars, useCreateEvent } from '../../hooks/useEvents';
import { useCalendarStore } from '../../store/calendarStore';
import { getTimezone, toLocalISODate, toLocalISOTime, combineDateAndTime } from '../../utils/timezone';
import type { CreateEventPayload } from '../../types';

interface CreateEventPopoverProps {
  position: { x: number; y: number } | null;
  initialStart: Date | null;
  initialEnd: Date | null;
  isAllDay: boolean;
  onClose: () => void;
  onMoreOptions: (title: string) => void;
  onSaveSuccess: () => void;
}

export const CreateEventPopover: React.FC<CreateEventPopoverProps> = ({
  position,
  initialStart,
  initialEnd,
  isAllDay,
  onClose,
  onMoreOptions,
  onSaveSuccess,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const { data: calendars = [] } = useCalendars();
  const createMutation = useCreateEvent();

  const [title, setTitle] = useState('');
  const [calendarId, setCalendarId] = useState('');

  // Set default calendar
  useEffect(() => {
    if (calendars.length > 0 && !calendarId) {
      setCalendarId(calendars[0].id);
    }
  }, [calendars, calendarId]);

  // Position logic
  useEffect(() => {
    if (!position || !popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = position.y;
    let left = position.x + 15;

    // Right overflow
    if (left + rect.width > viewportW - 20) {
      left = position.x - rect.width - 15;
    }

    // Bottom overflow
    if (top + rect.height > viewportH - 20) {
      top = viewportH - rect.height - 20;
    }

    // Ensure it doesn't go off screen
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    setPopoverPos({ top, left });
    setIsVisible(true);
    
    // Focus title input
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }, 50);
  }, [position]);

  // Handle escape and outside clicks
  useEffect(() => {
    if (!position) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay so the click that opened the popover doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [position, onClose]);

  // Submit
  const handleSave = async () => {
    if (!initialStart || !initialEnd) return;

    const startDt = isAllDay
      ? new Date(`${toLocalISODate(initialStart)}T00:00:00`)
      : initialStart;
    
    const endDt = isAllDay
      ? new Date(`${toLocalISODate(initialEnd)}T23:59:59`)
      : initialEnd;

    const payload: CreateEventPayload = {
      title: title || '(No title)',
      startUtc: startDt.toISOString(),
      endUtc: endDt.toISOString(),
      isAllDay,
      calendarId: calendarId || calendars[0]?.id,
      timezone: getTimezone(),
    };

    createMutation.mutate(
      { payload },
      {
        onSuccess: () => {
          onSaveSuccess();
          onClose();
        },
      }
    );
  };

  if (!position || !initialStart || !initialEnd) return null;

  // Format date/time display
  const dateDisplay = isAllDay
    ? format(initialStart, 'EEEE, MMMM d')
    : `${format(initialStart, 'EEEE, MMMM d')} ⋅ ${format(initialStart, 'h:mma').toLowerCase()} - ${format(initialEnd, 'h:mma').toLowerCase()}`;

  const selectedCalendar = calendars.find(c => c.id === calendarId) || calendars[0];

  return (
    <div
      ref={popoverRef}
      className={`fixed z-[100] bg-[#303134] rounded-lg shadow-2xl min-w-[450px] max-w-[500px] overflow-hidden border border-gray-700 transition-opacity duration-150 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ top: popoverPos.top, left: popoverPos.left }}
    >
      {/* Top drag handle / close row */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#202124] border-b border-gray-700">
        <div className="flex gap-2">
          {/* Decorative drag handle icon could go here */}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full text-gray-400">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 pl-12 relative">
        {/* Title Input */}
        <div className="mb-4 pr-4">
          <input
            ref={titleRef}
            type="text"
            placeholder="Add title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-[22px] bg-transparent text-gray-200 border-b-2 border-gray-500 focus:border-[#8ab4f8] outline-none pb-1 placeholder:text-gray-400 transition-colors"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 mb-6">
          <button className="bg-[#004a77] text-blue-200 px-4 py-1.5 rounded-md text-sm font-medium">
            Event
          </button>
          <button className="text-gray-300 hover:bg-gray-700 px-4 py-1.5 rounded-md text-sm font-medium">
            Task
          </button>
          <button className="text-gray-300 hover:bg-gray-700 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2">
            Appointment schedule
            <span className="bg-[#8ab4f8] text-[#202124] text-[10px] uppercase px-1.5 py-0.5 rounded-sm font-bold">New</span>
          </button>
        </div>

        {/* Date and Time */}
        <div className="flex items-start gap-4 mb-4">
          <div className="absolute left-4 top-[108px] text-gray-400">
            <Clock size={20} />
          </div>
          <div className="flex flex-col text-sm">
            <span className="text-gray-200">{dateDisplay}</span>
            <span className="text-gray-400">Time zone • Does not repeat</span>
          </div>
        </div>

        {/* Mock Buttons for other fields */}
        <div className="space-y-4 mb-6">
          <button className="flex items-center gap-4 text-sm text-gray-300 hover:bg-gray-700 w-full py-1 -ml-8 pl-8 rounded text-left">
            <Users size={20} className="text-gray-400" />
            Add guests
          </button>
          
          <button className="flex items-center gap-4 text-sm text-gray-300 hover:bg-gray-700 w-full py-1 -ml-8 pl-8 rounded text-left">
            <Video size={20} className="text-[#fbbc04]" />
            Add Google Meet video conferencing
          </button>

          <button className="flex items-center gap-4 text-sm text-gray-300 hover:bg-gray-700 w-full py-1 -ml-8 pl-8 rounded text-left">
            <MapPin size={20} className="text-gray-400" />
            Add location
          </button>

          <button className="flex items-center gap-4 text-sm text-gray-300 hover:bg-gray-700 w-full py-1 -ml-8 pl-8 rounded text-left">
            <AlignLeft size={20} className="text-gray-400" />
            Add description or a Google Drive attachment
          </button>

          {/* Calendar Selector */}
          <div className="flex items-center gap-4 text-sm text-gray-200 -ml-8 pl-8">
            <CalendarIcon size={20} className="text-gray-400" />
            <div className="flex flex-col w-full pr-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedCalendar?.name}</span>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedCalendar?.color || '#8ab4f8' }} 
                />
              </div>
              <span className="text-xs text-gray-400 mt-0.5">Busy • Default visibility • Notify 30 minutes before</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <button 
            onClick={() => onMoreOptions(title)}
            className="text-sm font-medium text-[#8ab4f8] hover:bg-gray-700 px-4 py-2 rounded transition-colors"
          >
            More options
          </button>
          <button 
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="bg-[#8ab4f8] text-[#202124] text-sm font-medium px-6 py-2 rounded-full hover:bg-blue-300 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
