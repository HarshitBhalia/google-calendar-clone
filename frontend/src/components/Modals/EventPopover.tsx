import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Pencil, Trash2, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { useDeleteEvent } from '../../hooks/useEvents';
import { formatDateRange, utcToLocal } from '../../utils/timezone';
import type { CalendarEvent } from '../../types';

interface EventPopoverProps {
  event: CalendarEvent | null;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
}

const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  position,
  onClose,
  onEdit,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const deleteEventMutation = useDeleteEvent();
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const isRecurring = !!event?.recurrenceRule;

  // Position the popover and adjust for viewport boundaries
  useEffect(() => {
    if (!event || !popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = position.y;
    let left = position.x + 10;

    // Adjust right overflow
    if (left + rect.width > viewportW - 20) {
      left = position.x - rect.width - 10;
    }

    // Adjust bottom overflow
    if (top + rect.height > viewportH - 20) {
      top = viewportH - rect.height - 20;
    }

    // Ensure not off top
    if (top < 10) top = 10;
    // Ensure not off left
    if (left < 10) left = 10;

    setPopoverPos({ top, left });
  }, [event, position]);

  // Close on ESC
  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [event, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!event) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to prevent immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [event, onClose]);

  const handleDelete = useCallback(
    (mode?: 'this' | 'future' | 'all') => {
      if (!event) return;
      deleteEventMutation.mutate(
        { id: event.id, deleteMode: mode },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    },
    [event, deleteEventMutation, onClose]
  );

  const handleEditClick = useCallback(() => {
    if (!event) return;
    onClose();
    onEdit(event);
  }, [event, onClose, onEdit]);

  if (!event) return null;

  const color = event.color || event.calendar?.color || '#1a73e8';
  const startDate = utcToLocal(event.startUtc);
  const endDate = utcToLocal(event.endUtc);
  const dateRangeStr = event.isAllDay
    ? `All day`
    : formatDateRange(startDate, endDate);

  return (
    <div
      ref={popoverRef}
      className="fixed z-[90] bg-white rounded-lg shadow-xl min-w-[300px] max-w-[360px] animate-slideUp overflow-hidden"
      style={{ top: popoverPos.top, left: popoverPos.left }}
    >
      {/* Color bar */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-4">
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-google-sans font-medium text-gc-gray-900 pr-4 leading-snug">
            {event.title || '(No title)'}
          </h3>
          <button onClick={onClose} className="btn-icon -mt-1 -mr-2 flex-shrink-0">
            <X size={18} className="text-gc-gray-600" />
          </button>
        </div>

        {/* Date/time */}
        <p className="text-sm text-gc-gray-700 mb-3">{dateRangeStr}</p>

        {/* Calendar name */}
        {event.calendar && (
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon size={14} className="text-gc-gray-600" />
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: event.calendar.color }}
              />
              <span className="text-sm text-gc-gray-700">{event.calendar.name}</span>
            </div>
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-gc-gray-600" />
            <span className="text-sm text-gc-gray-700">{event.location}</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gc-gray-600 mt-2 mb-3 whitespace-pre-wrap">
            {event.description}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-gc-gray-200 my-3" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleEditClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gc-gray-700 hover:bg-gc-gray-100 transition-colors"
          >
            <Pencil size={14} />
            Edit
          </button>

          {!showDeleteOptions ? (
            <button
              onClick={() => {
                if (isRecurring) {
                  setShowDeleteOptions(true);
                } else {
                  handleDelete();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gc-red hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          ) : (
            <div className="flex flex-col gap-1 ml-2">
              <span className="text-xs text-gc-gray-600 font-medium">Delete recurring event:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleDelete('this')}
                  className="px-2 py-1 text-xs rounded bg-gc-gray-100 text-gc-gray-700 hover:bg-gc-gray-200 transition-colors"
                >
                  This event
                </button>
                <button
                  onClick={() => handleDelete('future')}
                  className="px-2 py-1 text-xs rounded bg-gc-gray-100 text-gc-gray-700 hover:bg-gc-gray-200 transition-colors"
                >
                  This & future
                </button>
                <button
                  onClick={() => handleDelete('all')}
                  className="px-2 py-1 text-xs rounded bg-red-50 text-gc-red hover:bg-red-100 transition-colors"
                >
                  All events
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPopover;
