import React from 'react';
import type { EventContentArg } from '@fullcalendar/core';
import { format } from 'date-fns';

interface EventChipProps {
  eventInfo: EventContentArg;
}

const EventChip: React.FC<EventChipProps> = ({ eventInfo }) => {
  const { event, timeText } = eventInfo;
  const isAllDay = event.allDay;
  const color = event.backgroundColor || event.extendedProps?.color || '#1a73e8';
  const title = event.title || '(No title)';

  if (isAllDay) {
    return (
      <div
        className="px-1.5 py-0.5 rounded text-[11px] font-medium text-white truncate w-full"
        style={{ backgroundColor: color }}
        title={title}
      >
        {title}
      </div>
    );
  }

  // Check if we're in the month view (daygrid) — dot-style events
  if (eventInfo.view.type === 'dayGridMonth') {
    const startTime = event.start ? format(event.start, 'h:mm a') : '';
    return (
      <div className="flex items-center gap-1 truncate w-full text-[11px] py-0.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-gc-gray-700 flex-shrink-0">{startTime}</span>
        <span className="text-gc-gray-900 font-medium truncate">{title}</span>
      </div>
    );
  }

  // Time grid (week/day) view
  return (
    <div className="flex flex-col h-full overflow-hidden text-white py-0.5">
      <div className="text-[11px] font-medium truncate leading-tight">{title}</div>
      {timeText && (
        <div className="text-[10px] opacity-90 truncate leading-tight">{timeText}</div>
      )}
    </div>
  );
};

export default EventChip;
